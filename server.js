import http from "http";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { createRequire } from "module";

import envConfig from "./config/env.js";
import { indoorLocationService } from "./services/indoorLocation.js";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = envConfig.port;
const PUBLIC_DIR = path.resolve(__dirname);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

// ==========================================
// Security & Authentication Configuration
// ==========================================
const JWT_SECRET = envConfig.security.jwtSecret;
const ADMIN_PASSWORD = envConfig.security.adminPassword;
const DEV_ADMIN_PASSWORD = envConfig.security.devAdminPassword;
const MIKROTIK_FEED_KEY = envConfig.security.mikrotikFeedKey;

// Admin & Monitoring State
let lastMikrotikFeedTime = null;
const feedLogs = [];

// Lightweight sliding-window Rate Limiter (in-memory)
const rateLimitMap = new Map();
function checkRateLimit(ip, limit = 120, windowMs = 60000) {
  const now = Date.now();
  let entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetTime) {
    entry = { count: 1, resetTime: now + windowMs };
    rateLimitMap.set(ip, entry);
    return true;
  }
  entry.count++;
  return entry.count <= limit;
}

// Clean up expired rate limiter entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) rateLimitMap.delete(ip);
  }
}, 300000);

// Signed Token Helpers (HS256)
function generateAdminToken(
  username = "admin",
  role = "admin",
  expiresInSec = 86400,
) {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + expiresInSec;
  const payload = Buffer.from(
    JSON.stringify({ username, role, exp, iss: "moreno-resort" }),
  ).toString("base64url");
  const sig = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${sig}`;
}

function verifyAdminToken(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, sig] = parts;
  const expectedSig = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64url");
  if (sig !== expectedSig) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) return null; // Expired
    return data;
  } catch (err) {
    return null;
  }
}

function verifyAdminAuth(req, urlObj) {
  // 1. Check Bearer token in Authorization header
  const authHeader = req.headers["authorization"] || "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    const verified = verifyAdminToken(token);
    if (verified) return verified;
  }

  // 2. Check token in query param
  const queryToken = urlObj.searchParams.get("token");
  if (queryToken) {
    const verified = verifyAdminToken(queryToken);
    if (verified) return verified;
  }

  // 3. Fallback: Check admin key (legacy or API key support)
  const key = urlObj.searchParams.get("key") || req.headers["x-admin-key"];
  if (
    key &&
    (key === ADMIN_PASSWORD ||
      (DEV_ADMIN_PASSWORD && key === DEV_ADMIN_PASSWORD))
  ) {
    return { username: "admin", role: "admin" };
  }

  return null;
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 2 * 1024 * 1024) {
        req.destroy();
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const clientIp = req.socket.remoteAddress || "127.0.0.1";
  const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const reqPath = decodeURI(urlObj.pathname);

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, x-admin-key, x-feed-key",
  };

  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  // Apply general API rate limiting (150 requests per minute per IP)
  if (reqPath.startsWith("/api/") && !checkRateLimit(clientIp, 150, 60000)) {
    res.writeHead(429, {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    });
    res.end(
      JSON.stringify({
        success: false,
        error: "Too Many Requests. Please slow down.",
      }),
    );
    return;
  }

  // ==========================================
  // API Routes: Authentication & Management
  // ==========================================

  // Admin Login Endpoint
  if (reqPath === "/api/admin/login" && req.method === "POST") {
    // Strict rate limit for login attempts (10 attempts per 5 minutes)
    if (!checkRateLimit(`login_${clientIp}`, 10, 300000)) {
      res.writeHead(429, {
        ...corsHeaders,
        "Content-Type": "application/json; charset=utf-8",
      });
      res.end(
        JSON.stringify({
          success: false,
          error: "Too many login attempts. Locked for 5 minutes.",
        }),
      );
      return;
    }

    try {
      const body = await parseBody(req);
      const password = (body.password || body.key || "").trim();
      const username = (body.username || "admin").trim();

      if (
        password === ADMIN_PASSWORD ||
        (DEV_ADMIN_PASSWORD && password === DEV_ADMIN_PASSWORD)
      ) {
        const token = generateAdminToken(username, "admin", 86400); // 24-hour token
        res.writeHead(200, {
          ...corsHeaders,
          "Content-Type": "application/json; charset=utf-8",
        });
        res.end(
          JSON.stringify({
            success: true,
            message: "Authenticated successfully",
            token,
            role: "admin",
            username,
            expiresIn: 86400,
            mikrotikFeedKey: MIKROTIK_FEED_KEY,
          }),
        );
      } else {
        res.writeHead(401, {
          ...corsHeaders,
          "Content-Type": "application/json; charset=utf-8",
        });
        res.end(
          JSON.stringify({
            success: false,
            error: "Invalid admin credentials",
          }),
        );
      }
    } catch (err) {
      res.writeHead(400, {
        ...corsHeaders,
        "Content-Type": "application/json; charset=utf-8",
      });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // ==========================================
  // API Routes: WiFi Indoor Positioning
  // ==========================================

  // 1. Post MikroTik Registration-Table RSSI Feed
  if (reqPath === "/api/mikrotik/feed" && req.method === "POST") {
    // Verify Feed Authorization (Header, Query, or Bearer)
    const feedKey =
      req.headers["x-feed-key"] ||
      urlObj.searchParams.get("key") ||
      urlObj.searchParams.get("secret");
    const authHeader = req.headers["authorization"] || "";
    const isFeedAuthorized =
      feedKey === MIKROTIK_FEED_KEY ||
      feedKey === ADMIN_PASSWORD ||
      (authHeader &&
        verifyAdminToken(authHeader.replace("Bearer ", "").trim()));

    if (!isFeedAuthorized) {
      res.writeHead(401, {
        ...corsHeaders,
        "Content-Type": "application/json; charset=utf-8",
      });
      res.end(
        JSON.stringify({
          success: false,
          error: "Unauthorized MikroTik feed: Invalid or missing feed key",
        }),
      );
      return;
    }

    try {
      const feed = await parseBody(req);
      const rows = Array.isArray(feed) ? feed : feed.data || feed.clients || [];
      const results = indoorLocationService.processMikroTikFeed(rows);

      lastMikrotikFeedTime = Date.now();
      feedLogs.unshift({
        id: "feed_" + Date.now(),
        timestamp: Date.now(),
        count: rows.length,
        devicesProcessed: results.length,
        sample: rows.slice(0, 4),
        ip: req.socket.remoteAddress,
      });
      if (feedLogs.length > 50) feedLogs.pop();

      res.writeHead(200, {
        ...corsHeaders,
        "Content-Type": "application/json; charset=utf-8",
      });
      res.end(
        JSON.stringify({
          success: true,
          count: results.length,
          devices: results,
        }),
      );
    } catch (err) {
      res.writeHead(400, {
        ...corsHeaders,
        "Content-Type": "application/json; charset=utf-8",
      });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // 2. Query Device Location by MAC or list all devices
  if (reqPath === "/api/location" && req.method === "GET") {
    const mac = urlObj.searchParams.get("mac");
    if (mac) {
      const loc = indoorLocationService.getDeviceLocation(mac);
      if (!loc) {
        res.writeHead(404, {
          ...corsHeaders,
          "Content-Type": "application/json; charset=utf-8",
        });
        res.end(
          JSON.stringify({
            success: false,
            error: `Device with MAC ${mac} not found or inactive`,
          }),
        );
      } else {
        res.writeHead(200, {
          ...corsHeaders,
          "Content-Type": "application/json; charset=utf-8",
        });
        res.end(JSON.stringify({ success: true, location: loc }));
      }
    } else {
      const all = indoorLocationService.getAllDevices();
      res.writeHead(200, {
        ...corsHeaders,
        "Content-Type": "application/json; charset=utf-8",
      });
      res.end(
        JSON.stringify({ success: true, count: all.length, devices: all }),
      );
    }
    return;
  }

  // 3. Real-Time Server-Sent Events (SSE) Position Stream
  if (reqPath === "/api/location/stream" && req.method === "GET") {
    const targetMac = indoorLocationService.normalizeMac(
      urlObj.searchParams.get("mac"),
    );

    res.writeHead(200, {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    });
    res.write("retry: 2000\n\n");

    // Send immediate initial position if available
    if (targetMac) {
      const initLoc = indoorLocationService.getDeviceLocation(targetMac);
      if (initLoc) {
        res.write(`data: ${JSON.stringify(initLoc)}\n\n`);
      }
    }

    // Subscribe to live trilateration updates
    const unsubscribe = indoorLocationService.subscribe((deviceLoc) => {
      if (!targetMac || deviceLoc.mac === targetMac) {
        res.write(`data: ${JSON.stringify(deviceLoc)}\n\n`);
      }
    });

    // 15-second heartbeat to prevent proxy timeout
    const heartbeatTimer = setInterval(() => {
      res.write(": keepalive\n\n");
    }, 15000);

    req.on("close", () => {
      clearInterval(heartbeatTimer);
      unsubscribe();
    });
    return;
  }

  // 4. Configured Access Points List
  if (reqPath === "/api/access-points" && req.method === "GET") {
    const aps = indoorLocationService.getAccessPoints();
    res.writeHead(200, {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    });
    res.end(
      JSON.stringify({
        success: true,
        count: aps.length,
        mapWidth: indoorLocationService.mapWidth,
        mapHeight: indoorLocationService.mapHeight,
        accessPoints: aps,
      }),
    );
    return;
  }

  // 5. Admin Stats Endpoint for Monitoring Dashboard
  if (reqPath === "/api/admin/stats" && req.method === "GET") {
    const auth = verifyAdminAuth(req, urlObj);
    if (!auth) {
      res.writeHead(401, {
        ...corsHeaders,
        "Content-Type": "application/json; charset=utf-8",
      });
      res.end(
        JSON.stringify({
          success: false,
          error: "Unauthorized: Valid admin token or key required",
        }),
      );
      return;
    }

    const allDevices = indoorLocationService.getAllDevices();
    const aps = indoorLocationService.getAccessPoints();
    const now = Date.now();
    const lastFeedSec = lastMikrotikFeedTime
      ? Math.round((now - lastMikrotikFeedTime) / 1000)
      : null;
    const isFeedActive = lastFeedSec !== null && lastFeedSec <= 35;

    res.writeHead(200, {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    });
    res.end(
      JSON.stringify({
        success: true,
        connectedDevicesCount: allDevices.length,
        lastFeedTimestamp: lastMikrotikFeedTime,
        lastFeedSecondsAgo: lastFeedSec,
        feedStatus: isFeedActive ? "active" : "idle",
        activeDevices: allDevices,
        accessPointsCount: aps.length,
        accessPoints: aps,
        feedLogs: feedLogs.slice(0, 30),
        serverUptimeSec: Math.round(process.uptime()),
        systemTime: new Date().toISOString(),
      }),
    );
    return;
  }

  // 6. Admin Purge Inactive Devices Endpoint
  if (reqPath === "/api/admin/purge" && req.method === "POST") {
    const auth = verifyAdminAuth(req, urlObj);
    if (!auth) {
      res.writeHead(401, {
        ...corsHeaders,
        "Content-Type": "application/json; charset=utf-8",
      });
      res.end(
        JSON.stringify({
          success: false,
          error: "Unauthorized: Valid admin token required",
        }),
      );
      return;
    }
    indoorLocationService.deviceStates.clear();
    res.writeHead(200, {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    });
    res.end(
      JSON.stringify({
        success: true,
        message: "All active device states purged",
      }),
    );
    return;
  }

  // 6.5 WiFi Radio Fingerprints Survey & Calibration APIs (Protected)
  if (reqPath === "/api/admin/fingerprints" && req.method === "GET") {
    const auth = verifyAdminAuth(req, urlObj);
    if (!auth) {
      res.writeHead(401, {
        ...corsHeaders,
        "Content-Type": "application/json; charset=utf-8",
      });
      res.end(
        JSON.stringify({
          success: false,
          error: "Unauthorized: Valid admin token required",
        }),
      );
      return;
    }
    const list = indoorLocationService.getFingerprints();
    res.writeHead(200, {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    });
    res.end(
      JSON.stringify({ success: true, count: list.length, fingerprints: list }),
    );
    return;
  }

  if (reqPath === "/api/admin/fingerprints" && req.method === "POST") {
    const auth = verifyAdminAuth(req, urlObj);
    if (!auth) {
      res.writeHead(401, {
        ...corsHeaders,
        "Content-Type": "application/json; charset=utf-8",
      });
      res.end(
        JSON.stringify({
          success: false,
          error: "Unauthorized: Valid admin token required",
        }),
      );
      return;
    }
    try {
      const body = await parseBody(req);
      const fp = indoorLocationService.addFingerprint(body);
      res.writeHead(200, {
        ...corsHeaders,
        "Content-Type": "application/json; charset=utf-8",
      });
      res.end(JSON.stringify({ success: true, fingerprint: fp }));
    } catch (err) {
      res.writeHead(400, {
        ...corsHeaders,
        "Content-Type": "application/json; charset=utf-8",
      });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  if (
    (reqPath === "/api/admin/fingerprints" ||
      reqPath.startsWith("/api/admin/fingerprints/")) &&
    req.method === "DELETE"
  ) {
    const auth = verifyAdminAuth(req, urlObj);
    if (!auth) {
      res.writeHead(401, {
        ...corsHeaders,
        "Content-Type": "application/json; charset=utf-8",
      });
      res.end(
        JSON.stringify({
          success: false,
          error: "Unauthorized: Valid admin token required",
        }),
      );
      return;
    }
    const parts = reqPath.split("/");
    const idFromPath = parts.length > 4 ? decodeURIComponent(parts[4]) : null;
    const targetId = idFromPath || urlObj.searchParams.get("id");
    if (!targetId) {
      res.writeHead(400, {
        ...corsHeaders,
        "Content-Type": "application/json; charset=utf-8",
      });
      res.end(
        JSON.stringify({ success: false, error: "Fingerprint ID is required" }),
      );
      return;
    }
    const deleted = indoorLocationService.deleteFingerprint(targetId);
    res.writeHead(200, {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    });
    res.end(JSON.stringify({ success: true, deleted, id: targetId }));
    return;
  }

  // 7. Test Simulation Generator: Simulate device roaming across APs
  if (
    (reqPath === "/api/mikrotik/simulate" || reqPath === "/api/simulate") &&
    req.method === "POST"
  ) {
    const auth = verifyAdminAuth(req, urlObj);
    const isLocalhost =
      req.headers.host &&
      (req.headers.host.includes("localhost") ||
        req.headers.host.includes("127.0.0.1"));
    if (!auth && !isLocalhost) {
      res.writeHead(401, {
        ...corsHeaders,
        "Content-Type": "application/json; charset=utf-8",
      });
      res.end(
        JSON.stringify({
          success: false,
          error: "Unauthorized simulation request",
        }),
      );
      return;
    }
    try {
      const body = await parseBody(req);
      const testMac = indoorLocationService.normalizeMac(
        body.mac || "A4:C3:F0:77:88:99",
      );
      const targetX = Number(body.x != null ? body.x : 344); // default: Lotus Pool
      const targetY = Number(body.y != null ? body.y : 665);

      // Generate synthetic RSSI for all configured APs
      const syntheticRows = indoorLocationService
        .getAccessPoints()
        .map((ap) => {
          const distM = Math.max(
            0.5,
            Math.hypot(targetX - ap.x, targetY - ap.y) *
              indoorLocationService.metersPerPixel,
          );
          // Add random measurement noise (+- 2 dBm)
          const noise = (Math.random() - 0.5) * 4.0;
          const rssi = Math.round(
            indoorLocationService.distanceToRssi(
              distM,
              ap.refRssi1m,
              ap.pathLossN,
            ) + noise,
          );
          return {
            "mac-address": testMac,
            "signal-strength": `${rssi}dBm`,
            "ap-bssid": ap.bssid,
          };
        });

      const updated = indoorLocationService.processMikroTikFeed(syntheticRows);

      lastMikrotikFeedTime = Date.now();
      feedLogs.unshift({
        id: "sim_" + Date.now(),
        timestamp: Date.now(),
        count: syntheticRows.length,
        devicesProcessed: 1,
        sample: syntheticRows.slice(0, 3),
        isSimulation: true,
        ip: req.socket.remoteAddress,
      });
      if (feedLogs.length > 50) feedLogs.pop();

      res.writeHead(200, {
        ...corsHeaders,
        "Content-Type": "application/json; charset=utf-8",
      });
      res.end(
        JSON.stringify({
          success: true,
          simulatedTarget: { x: targetX, y: targetY },
          result: updated[0],
        }),
      );
    } catch (err) {
      res.writeHead(400, {
        ...corsHeaders,
        "Content-Type": "application/json; charset=utf-8",
      });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // ==========================================
  // Static File Serving
  // ==========================================
  let staticPath = reqPath;
  if (staticPath === "/" || staticPath === "") {
    staticPath = "/index.html";
  } else if (staticPath === "/admin" || staticPath === "/admin/") {
    staticPath = "/admin.html";
  }

  const filePath = path.join(PUBLIC_DIR, staticPath);

  // Security: prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("403 Forbidden");
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("404 Not Found: " + reqPath);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const etag = `"${stats.size.toString(16)}-${stats.mtime.getTime().toString(16)}"`;
    const lastModified = stats.mtime.toUTCString();

    const isHtml = ext === ".html";
    const isServiceWorker = staticPath.endsWith("sw.js");
    const cacheControl =
      isHtml || isServiceWorker
        ? "public, max-age=0, must-revalidate"
        : "public, max-age=604800, stale-while-revalidate=86400";

    // HTTP 304 Not Modified validation for instant cached response
    const clientEtag = req.headers["if-none-match"];
    const clientModifiedSince = req.headers["if-modified-since"];
    const etagMatches =
      clientEtag &&
      (clientEtag === etag || clientEtag.replace(/^W\//, "") === etag);
    const timeMatches =
      clientModifiedSince &&
      new Date(clientModifiedSince).getTime() >=
        Math.floor(stats.mtime.getTime() / 1000) * 1000;

    if (etagMatches || timeMatches) {
      const headers304 = {
        ETag: etag,
        "Last-Modified": lastModified,
        "Cache-Control": cacheControl,
        "Access-Control-Allow-Origin": "*",
      };
      if (isServiceWorker) headers304["Service-Worker-Allowed"] = "/";
      res.writeHead(304, headers304);
      res.end();
      return;
    }

    const headers = {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": cacheControl,
      ETag: etag,
      "Last-Modified": lastModified,
      Vary: "Accept-Encoding",
    };

    if (isServiceWorker) {
      headers["Service-Worker-Allowed"] = "/";
    }

    // High-speed Gzip / Deflate compression for all text-based assets
    const isCompressible = [
      ".html",
      ".css",
      ".js",
      ".json",
      ".svg",
      ".xml",
    ].includes(ext);
    const acceptEncoding = (req.headers["accept-encoding"] || "").toLowerCase();

    if (isCompressible && acceptEncoding.includes("gzip")) {
      headers["Content-Encoding"] = "gzip";
      res.writeHead(200, headers);
      fs.createReadStream(filePath)
        .pipe(zlib.createGzip({ level: 6 }))
        .pipe(res);
    } else if (isCompressible && acceptEncoding.includes("deflate")) {
      headers["Content-Encoding"] = "deflate";
      res.writeHead(200, headers);
      fs.createReadStream(filePath).pipe(zlib.createDeflate()).pipe(res);
    } else {
      res.writeHead(200, headers);
      fs.createReadStream(filePath).pipe(res);
    }
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n======================================================`);
  console.log(`🌴 Moreno Horizon Spa & Resort - Localhost Server Started`);
  console.log(`======================================================`);
  console.log(` > Local:   http://localhost:${PORT}`);
  console.log(` > Network: http://127.0.0.1:${PORT}`);
  console.log(`======================================================\n`);
});
