const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.resolve(__dirname);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const { indoorLocationService } = require('./services/indoorLocation');

// Admin & Monitoring State
let lastMikrotikFeedTime = null;
const feedLogs = [];
const ADMIN_SECRET = process.env.ADMIN_KEY || 'admin123';

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
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const reqPath = decodeURI(urlObj.pathname);

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-key'
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  // ==========================================
  // API Routes: WiFi Indoor Positioning
  // ==========================================

  // 1. Post MikroTik Registration-Table RSSI Feed
  if (reqPath === '/api/mikrotik/feed' && req.method === 'POST') {
    try {
      const feed = await parseBody(req);
      const rows = Array.isArray(feed) ? feed : (feed.data || feed.clients || []);
      const results = indoorLocationService.processMikroTikFeed(rows);

      lastMikrotikFeedTime = Date.now();
      feedLogs.unshift({
        id: 'feed_' + Date.now(),
        timestamp: Date.now(),
        count: rows.length,
        devicesProcessed: results.length,
        sample: rows.slice(0, 4),
        ip: req.socket.remoteAddress
      });
      if (feedLogs.length > 50) feedLogs.pop();

      res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, count: results.length, devices: results }));
    } catch (err) {
      res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // 2. Query Device Location by MAC or list all devices
  if (reqPath === '/api/location' && req.method === 'GET') {
    const mac = urlObj.searchParams.get('mac');
    if (mac) {
      const loc = indoorLocationService.getDeviceLocation(mac);
      if (!loc) {
        res.writeHead(404, { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: `Device with MAC ${mac} not found or inactive` }));
      } else {
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, location: loc }));
      }
    } else {
      const all = indoorLocationService.getAllDevices();
      res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, count: all.length, devices: all }));
    }
    return;
  }

  // 3. Real-Time Server-Sent Events (SSE) Position Stream
  if (reqPath === '/api/location/stream' && req.method === 'GET') {
    const targetMac = indoorLocationService.normalizeMac(urlObj.searchParams.get('mac'));

    res.writeHead(200, {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    });
    res.write('retry: 2000\n\n');

    // Send immediate initial position if available
    if (targetMac) {
      const initLoc = indoorLocationService.getDeviceLocation(targetMac);
      if (initLoc) {
        res.write(`data: ${JSON.stringify(initLoc)}\n\n`);
      }
    }

    // Subscribe to live trilateration updates
    const unsubscribe = indoorLocationService.subscribe(deviceLoc => {
      if (!targetMac || deviceLoc.mac === targetMac) {
        res.write(`data: ${JSON.stringify(deviceLoc)}\n\n`);
      }
    });

    // 15-second heartbeat to prevent proxy timeout
    const heartbeatTimer = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 15000);

    req.on('close', () => {
      clearInterval(heartbeatTimer);
      unsubscribe();
    });
    return;
  }

  // 4. Configured Access Points List
  if (reqPath === '/api/access-points' && req.method === 'GET') {
    const aps = indoorLocationService.getAccessPoints();
    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      count: aps.length,
      mapWidth: indoorLocationService.mapWidth,
      mapHeight: indoorLocationService.mapHeight,
      accessPoints: aps
    }));
    return;
  }

  // 5. Admin Stats Endpoint for Monitoring Dashboard
  if (reqPath === '/api/admin/stats' && req.method === 'GET') {
    const key = urlObj.searchParams.get('key') || req.headers['x-admin-key'];
    const isLocalhost = req.headers.host && (req.headers.host.includes('localhost') || req.headers.host.includes('127.0.0.1'));
    if (!isLocalhost && key !== ADMIN_SECRET) {
      res.writeHead(401, { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'Unauthorized: Invalid admin key' }));
      return;
    }

    const allDevices = indoorLocationService.getAllDevices();
    const aps = indoorLocationService.getAccessPoints();
    const now = Date.now();
    const lastFeedSec = lastMikrotikFeedTime ? Math.round((now - lastMikrotikFeedTime) / 1000) : null;
    const isFeedActive = lastFeedSec !== null && lastFeedSec <= 35;

    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      connectedDevicesCount: allDevices.length,
      lastFeedTimestamp: lastMikrotikFeedTime,
      lastFeedSecondsAgo: lastFeedSec,
      feedStatus: isFeedActive ? 'active' : 'idle',
      activeDevices: allDevices,
      accessPointsCount: aps.length,
      accessPoints: aps,
      feedLogs: feedLogs.slice(0, 30),
      serverUptimeSec: Math.round(process.uptime()),
      systemTime: new Date().toISOString()
    }));
    return;
  }

  // 6. Admin Purge Inactive Devices Endpoint
  if (reqPath === '/api/admin/purge' && req.method === 'POST') {
    const key = urlObj.searchParams.get('key') || req.headers['x-admin-key'];
    const isLocalhost = req.headers.host && (req.headers.host.includes('localhost') || req.headers.host.includes('127.0.0.1'));
    if (!isLocalhost && key !== ADMIN_SECRET) {
      res.writeHead(401, { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'Unauthorized' }));
      return;
    }
    indoorLocationService.deviceStates.clear();
    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'All active device states purged' }));
    return;
  }

  // 7. Test Simulation Generator: Simulate device roaming across APs
  if ((reqPath === '/api/mikrotik/simulate' || reqPath === '/api/simulate') && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const testMac = indoorLocationService.normalizeMac(body.mac || 'A4:C3:F0:77:88:99');
      const targetX = Number(body.x != null ? body.x : 344); // default: Lotus Pool
      const targetY = Number(body.y != null ? body.y : 665);

      // Generate synthetic RSSI for all configured APs
      const syntheticRows = indoorLocationService.getAccessPoints().map(ap => {
        const distM = Math.max(0.5, Math.hypot(targetX - ap.x, targetY - ap.y) * indoorLocationService.metersPerPixel);
        // Add random measurement noise (+- 2 dBm)
        const noise = (Math.random() - 0.5) * 4.0;
        const rssi = Math.round(indoorLocationService.distanceToRssi(distM, ap.refRssi1m, ap.pathLossN) + noise);
        return {
          'mac-address': testMac,
          'signal-strength': `${rssi}dBm`,
          'ap-bssid': ap.bssid
        };
      });

      const updated = indoorLocationService.processMikroTikFeed(syntheticRows);

      lastMikrotikFeedTime = Date.now();
      feedLogs.unshift({
        id: 'sim_' + Date.now(),
        timestamp: Date.now(),
        count: syntheticRows.length,
        devicesProcessed: 1,
        sample: syntheticRows.slice(0, 3),
        isSimulation: true,
        ip: req.socket.remoteAddress
      });
      if (feedLogs.length > 50) feedLogs.pop();

      res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, simulatedTarget: { x: targetX, y: targetY }, result: updated[0] }));
    } catch (err) {
      res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // ==========================================
  // Static File Serving
  // ==========================================
  let staticPath = reqPath;
  if (staticPath === '/' || staticPath === '') {
    staticPath = '/index.html';
  } else if (staticPath === '/admin' || staticPath === '/admin/') {
    staticPath = '/admin.html';
  }

  const filePath = path.join(PUBLIC_DIR, staticPath);

  // Security: prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found: ' + reqPath);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const headers = {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': (ext === '.html' || ext === '.js' || ext === '.json' || ext === '.css') ? 'no-cache, no-store, must-revalidate' : 'public, max-age=3600'
    };

    if (staticPath.endsWith('sw.js')) {
      headers['Service-Worker-Allowed'] = '/';
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    }

    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🌴 Moreno Horizon Spa & Resort - Localhost Server Started`);
  console.log(`======================================================`);
  console.log(` > Local:   http://localhost:${PORT}`);
  console.log(` > Network: http://127.0.0.1:${PORT}`);
  console.log(`======================================================\n`);
});
