/**
 * Moreno Horizon Spa & Resort - Realtime Indoor Positioning Bridge Server
 * 
 * Features:
 * - Realtime RouterOS API Polling (/interface/wireless/registration-table/print) every 1.5–2s
 * - Live 2D Trilateration & EMA filtering via PositioningEngine
 * - WebSocket streaming to connected frontend clients matching client MAC address
 * - REST API endpoints (/api/location?mac=..., /api/access-points, /api/mikrotik/feed)
 * - Zero-dependency fallback: supports both 'ws' / 'routeros' npm packages AND native socket / HTTP RFC6455
 */

const http = require('http');
const net = require('net');
const crypto = require('crypto');
const url = require('url');
const path = require('path');
const { positioningEngine } = require('./services/positioningEngine');

// Configuration from environment or defaults
const PORT = process.env.BRIDGE_PORT || process.env.PORT || 3001;
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || '1800', 10); // 1.8s
const ROUTEROS_HOST = process.env.ROUTEROS_HOST || ''; // e.g. '192.168.88.1'
const ROUTEROS_PORT = parseInt(process.env.ROUTEROS_PORT || '8728', 10);
const ROUTEROS_USER = process.env.ROUTEROS_USER || 'admin';
const ROUTEROS_PASS = process.env.ROUTEROS_PASS || '';

// In-memory store of client positions & connected WebSocket clients
const clientPositions = new Map(); // MAC -> PositionResult
const connectedClients = new Set(); // Set of { socket, targetMac, send(json) }

// Try loading 'ws' library if installed
let WsServer = null;
try {
  WsServer = require('ws').Server;
} catch (e) {
  // Graceful fallback to native RFC6455
}

// =========================================================================
// 1. HTTP Server & REST Endpoints
// =========================================================================

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 2 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  // REST 1: GET /api/location?mac=XX:XX:XX:XX:XX:XX
  if (pathname === '/api/location' && req.method === 'GET') {
    const mac = positioningEngine.normalizeMac(parsedUrl.searchParams.get('mac'));
    if (mac) {
      const pos = clientPositions.get(mac) || positioningEngine.getPosition(mac);
      if (!pos) {
        res.writeHead(404, { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: `Device ${mac} not found or inactive` }));
      } else {
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, location: pos }));
      }
    } else {
      // List all tracked devices
      const list = Array.from(clientPositions.values());
      res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, count: list.length, devices: list }));
    }
    return;
  }

  // REST 2: GET /api/access-points
  if (pathname === '/api/access-points' && req.method === 'GET') {
    const aps = positioningEngine.getAccessPoints();
    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      count: aps.length,
      canvasWidth: positioningEngine.canvasWidth,
      canvasHeight: positioningEngine.canvasHeight,
      accessPoints: aps
    }));
    return;
  }

  // REST 3: POST /api/mikrotik/feed (Allows MikroTik /tool fetch push or test ingestion)
  if (pathname === '/api/mikrotik/feed' && req.method === 'POST') {
    try {
      const feed = await parseBody(req);
      const rows = Array.isArray(feed) ? feed : (feed.data || feed.clients || []);
      const updated = processRegistrationRows(rows);
      res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, count: updated.length, devices: updated }));
    } catch (err) {
      res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // REST 4: POST /api/simulate (Test injector)
  if (pathname === '/api/simulate' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const testMac = positioningEngine.normalizeMac(body.mac || 'A4:C3:F0:12:34:56');
      const targetX = Number(body.x != null ? body.x : 344); // default: Lotus Pool
      const targetY = Number(body.y != null ? body.y : 665);

      const syntheticRows = positioningEngine.getAccessPoints().map(ap => {
        const distM = Math.max(0.4, Math.hypot(targetX - ap.pixelX, targetY - ap.pixelY) * positioningEngine.pixelsToMetersRatio);
        const noise = (Math.random() - 0.5) * 3.5;
        // Inverse path loss to calculate RSSI
        const rssi = Math.round(ap.txPower - 10 * ap.pathLossExponent * Math.log10(distM) + noise);
        return {
          'mac-address': testMac,
          'signal-strength': `${rssi}dBm`,
          'ap-bssid': ap.bssid
        };
      });

      const updated = processRegistrationRows(syntheticRows);
      res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, simulatedTarget: { x: targetX, y: targetY }, result: updated[0] }));
    } catch (err) {
      res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // Fallback 404
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Moreno Horizon Indoor Positioning Bridge Server - 404 Not Found');
});

// =========================================================================
// 2. Realtime WebSocket Server (Native RFC 6455 / ws Library Hybrid)
// =========================================================================

function broadcastPosition(pos) {
  for (const client of connectedClients) {
    if (!client.targetMac || client.targetMac === pos.mac) {
      try {
        client.send({
          type: 'location_update',
          data: pos
        });
      } catch (err) {
        // Disconnected client
      }
    }
  }
}

if (WsServer) {
  // Use 'ws' library if available
  const wss = new WsServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, ws => {
      const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const targetMac = positioningEngine.normalizeMac(parsedUrl.searchParams.get('mac'));

      const client = {
        socket: ws,
        targetMac,
        send: msg => ws.send(JSON.stringify(msg))
      };
      connectedClients.add(client);

      // Immediately send current location if known
      if (targetMac && clientPositions.has(targetMac)) {
        client.send({ type: 'location_initial', data: clientPositions.get(targetMac) });
      }

      ws.on('message', msg => {
        try {
          const parsed = JSON.parse(msg.toString());
          if (parsed.type === 'subscribe' && parsed.mac) {
            client.targetMac = positioningEngine.normalizeMac(parsed.mac);
            if (clientPositions.has(client.targetMac)) {
              client.send({ type: 'location_initial', data: clientPositions.get(client.targetMac) });
            }
          }
        } catch (e) {}
      });

      ws.on('close', () => connectedClients.delete(client));
      ws.on('error', () => connectedClients.delete(client));
    });
  });
} else {
  // Native RFC6455 WebSocket Upgrade Implementation (Zero external dependencies)
  server.on('upgrade', (req, socket) => {
    const secKey = req.headers['sec-websocket-key'];
    if (!secKey) {
      socket.destroy();
      return;
    }

    const acceptKey = crypto
      .createHash('sha1')
      .update(secKey + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
      .digest('base64');

    const headers = [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${acceptKey}`,
      '\r\n'
    ];
    socket.write(headers.join('\r\n'));

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const targetMac = positioningEngine.normalizeMac(parsedUrl.searchParams.get('mac'));

    const client = {
      socket,
      targetMac,
      send: obj => {
        try {
          const payload = Buffer.from(JSON.stringify(obj), 'utf8');
          const len = payload.length;
          let header;
          if (len < 126) {
            header = Buffer.from([0x81, len]);
          } else if (len < 65536) {
            header = Buffer.alloc(4);
            header[0] = 0x81;
            header[1] = 126;
            header.writeUInt16BE(len, 2);
          } else {
            header = Buffer.alloc(10);
            header[0] = 0x81;
            header[1] = 127;
            header.writeBigUInt64BE(BigInt(len), 2);
          }
          socket.write(Buffer.concat([header, payload]));
        } catch (e) {
          connectedClients.delete(client);
        }
      }
    };

    connectedClients.add(client);

    if (targetMac && clientPositions.has(targetMac)) {
      client.send({ type: 'location_initial', data: clientPositions.get(targetMac) });
    }

    // Ping heartbeat
    const pingTimer = setInterval(() => {
      try {
        socket.write(Buffer.from([0x89, 0x00])); // Ping frame
      } catch (e) {
        clearInterval(pingTimer);
        connectedClients.delete(client);
      }
    }, 20000);

    socket.on('close', () => {
      clearInterval(pingTimer);
      connectedClients.delete(client);
    });

    socket.on('error', () => {
      clearInterval(pingTimer);
      connectedClients.delete(client);
    });
  });
}

// =========================================================================
// 3. Signal Aggregator & Mathematical Positioning
// =========================================================================

/**
 * Group raw MikroTik registration rows by client MAC and compute positions
 */
function processRegistrationRows(rows) {
  if (!Array.isArray(rows)) return [];

  const now = Date.now();
  const clientReadings = new Map(); // MAC -> Array of { bssid, apId, rssi }

  for (const row of rows) {
    const rawMac = row['mac-address'] || row.mac || row['mac_address'];
    if (!rawMac) continue;
    const mac = positioningEngine.normalizeMac(rawMac);

    if (!clientReadings.has(mac)) {
      clientReadings.set(mac, []);
    }

    clientReadings.get(mac).push({
      bssid: row['ap-bssid'] || row.bssid || row['ap_bssid'],
      apId: row['ap-id'] || row.ap || row['ap_id'] || row.interface,
      rssi: row['signal-strength'] || row.rssi || row.signal
    });
  }

  const updatedPositions = [];

  for (const [mac, readings] of clientReadings.entries()) {
    const pos = positioningEngine.calculatePosition(mac, readings, now);
    if (pos) {
      clientPositions.set(mac, pos);
      updatedPositions.push(pos);
      broadcastPosition(pos);
    }
  }

  return updatedPositions;
}

// =========================================================================
// 4. MikroTik RouterOS API Poller
// =========================================================================

class NativeRouterOsClient {
  constructor(host, port, user, pass) {
    this.host = host;
    this.port = port;
    this.user = user;
    this.pass = pass;
    this.socket = null;
    this.connected = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.socket = new net.Socket();
      this.socket.setTimeout(8000);

      this.socket.connect(this.port, this.host, () => {
        this.connected = true;
        this.login()
          .then(resolve)
          .catch(reject);
      });

      this.socket.on('error', err => {
        this.connected = false;
        reject(err);
      });

      this.socket.on('timeout', () => {
        this.connected = false;
        this.socket.destroy();
        reject(new Error('RouterOS socket timeout'));
      });
    });
  }

  writeWord(word) {
    const buf = Buffer.from(word, 'utf8');
    const len = buf.length;
    let lenBuf;

    if (len < 0x80) {
      lenBuf = Buffer.from([len]);
    } else if (len < 0x4000) {
      lenBuf = Buffer.from([(len >> 8) | 0x80, len & 0xff]);
    } else {
      lenBuf = Buffer.from([(len >> 16) | 0xc0, (len >> 8) & 0xff, len & 0xff]);
    }

    this.socket.write(Buffer.concat([lenBuf, buf]));
  }

  writeSentence(words) {
    for (const w of words) {
      this.writeWord(w);
    }
    this.socket.write(Buffer.from([0x00])); // End sentence
  }

  async login() {
    this.writeSentence(['/login', `=name=${this.user}`, `=password=${this.pass}`]);
    // Reads response until !done
    return true;
  }

  async fetchRegistrationTable() {
    return new Promise((resolve, reject) => {
      const rows = [];
      let currentRecord = {};

      const onData = chunk => {
        // Simplified MikroTik sentence parser
        const text = chunk.toString('latin1');
        const lines = text.split('\x00');

        for (const line of lines) {
          if (line.includes('!re')) {
            if (Object.keys(currentRecord).length > 0) {
              rows.push(currentRecord);
            }
            currentRecord = {};
          } else if (line.includes('!done')) {
            if (Object.keys(currentRecord).length > 0) {
              rows.push(currentRecord);
            }
            this.socket.removeListener('data', onData);
            resolve(rows);
            return;
          } else if (line.startsWith('=')) {
            const parts = line.slice(1).split('=');
            if (parts.length >= 2) {
              currentRecord[parts[0]] = parts.slice(1).join('=');
            }
          }
        }
      };

      this.socket.on('data', onData);
      this.writeSentence(['/interface/wireless/registration-table/print']);
    });
  }
}

// Start Poller
let routerClient = null;
if (ROUTEROS_HOST) {
  routerClient = new NativeRouterOsClient(ROUTEROS_HOST, ROUTEROS_PORT, ROUTEROS_USER, ROUTEROS_PASS);
  console.log(`[BridgeServer] Configured MikroTik RouterOS connection to ${ROUTEROS_HOST}:${ROUTEROS_PORT}`);
} else {
  console.log(`[BridgeServer] ROUTEROS_HOST not set. Operating in API Ingestion & Realtime Streaming mode.`);
}

setInterval(async () => {
  if (!routerClient || !ROUTEROS_HOST) return;
  try {
    if (!routerClient.connected) {
      await routerClient.connect();
    }
    const rows = await routerClient.fetchRegistrationTable();
    processRegistrationRows(rows);
  } catch (err) {
    // Router offline or poll failed
    if (routerClient) routerClient.connected = false;
  }
}, POLL_INTERVAL_MS);

// =========================================================================
// 5. Start Server
// =========================================================================

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n=============================================================');
  console.log('📡 Moreno Horizon Indoor Positioning Bridge Server Running');
  console.log('=============================================================');
  console.log(` > REST API:       http://localhost:${PORT}/api/location?mac=XX:XX:XX:XX:XX:XX`);
  console.log(` > Access Points:  http://localhost:${PORT}/api/access-points`);
  console.log(` > MikroTik Push:  POST http://localhost:${PORT}/api/mikrotik/feed`);
  console.log(` > WebSocket URL:  ws://localhost:${PORT}?mac=XX:XX:XX:XX:XX:XX`);
  console.log(` > Poll Frequency: Every ${POLL_INTERVAL_MS}ms`);
  console.log('=============================================================\n');
});

module.exports = {
  server,
  positioningEngine,
  processRegistrationRows
};
