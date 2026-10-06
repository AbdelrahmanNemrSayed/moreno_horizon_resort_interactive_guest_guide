/**
 * Moreno Horizon Spa & Resort - Map-Matching & Snap-to-Path Algorithm
 * 
 * Capabilities:
 * 1. Paved Path Orthogonal Snapping:
 *    - Extracts all unique walkable segments from VirtualResortMap.nodes.
 *    - Projects estimated WiFi coordinates onto the closest paved walkway edge.
 *    - Prevents guests from appearing inside swimming pools, lawns, or rooftops.
 * 2. Free-Roam Zones:
 *    - Allows free 2D movement within open plazas, lobby halls, dining terraces, and beach decks.
 * 3. Adaptive Exponential Smoothing (EMA):
 *    - Eliminates sudden jumps or jitter while maintaining responsive real-time motion.
 */

const MapMatcher = {
  CANVAS_WIDTH: 896,
  CANVAS_HEIGHT: 1200,
  PIXELS_PER_METER: 2.381,
  METERS_PER_PIXEL: 0.42,
  SNAP_THRESHOLD_METERS: 12.0, // 12m threshold (~28.5 px)
  ALPHA_SMOOTH: 0.38, // Smoothing weight for steady tracking

  edges: [],
  isInitialized: false,
  lastPosition: null,

  // Free-roam zones where guests can wander freely (restaurants, plazas, lobby, beach sand)
  freeRoamZones: [
    { id: 'lobby_m', name: 'Main Lobby Hall', x: 283, y: 820, radiusPx: 45 },
    { id: 'grand_plaza', name: 'Grand Entrance Plaza', x: 340, y: 876, radiusPx: 50 },
    { id: 'sirena_terrace', name: 'Sirena Restaurant Terrace', x: 325, y: 810, radiusPx: 40 },
    { id: 'beach_sand', name: 'Beach Shoreline & Marina Deck', x: 381, y: 281, radiusPx: 55 },
    { id: 'beach_bar_deck', name: 'Beach Bar Pergola', x: 428, y: 340, radiusPx: 35 },
    { id: 'oriental_deck', name: 'Oriental Grill Garden', x: 442, y: 535, radiusPx: 35 },
    { id: 'la_mama_indoor', name: 'La Mama Dining Room', x: 348, y: 575, radiusPx: 32 },
    { id: 'spa_interior', name: 'Spa & Wellness Club', x: 170, y: 750, radiusPx: 38 },
    { id: 'tennis_court', name: 'Tennis Courts Area', x: 618, y: 732, radiusPx: 45 },
    { id: 'mall_mls', name: 'Commercial Mall MLS Plaza', x: 163, y: 1037, radiusPx: 45 },
    { id: 'clinic_mosque', name: 'Clinic & Mosque Courtyard', x: 400, y: 1049, radiusPx: 42 },
    { id: 'wing_n_lounge', name: 'North Wing Inner Lounge', x: 201, y: 662, radiusPx: 32 },
    { id: 'wing_s_lounge', name: 'South Wing Inner Lounge', x: 565, y: 650, radiusPx: 32 }
  ],

  init() {
    if (this.isInitialized) return;
    this.buildEdgeSegments();
    this.isInitialized = true;
    console.log(`[MapMatcher] Initialized with ${this.edges.length} path segments and ${this.freeRoamZones.length} free-roam zones.`);
  },

  /**
   * Precomputes all unique line segments from VirtualResortMap.nodes
   */
  buildEdgeSegments() {
    const network = window.VirtualResortMap;
    if (!network || !network.nodes) {
      setTimeout(() => this.buildEdgeSegments(), 250);
      return;
    }

    const uniqueEdgeMap = new Set();
    this.edges = [];

    for (const [nodeId, node] of Object.entries(network.nodes)) {
      if (!node.neighbors || !Array.isArray(node.neighbors)) continue;
      for (const neighborId of node.neighbors) {
        const neighbor = network.nodes[neighborId];
        if (!neighbor) continue;

        const edgeKey = [nodeId, neighborId].sort().join('--');
        if (uniqueEdgeMap.has(edgeKey)) continue;
        uniqueEdgeMap.add(edgeKey);

        const dx = neighbor.x - node.x;
        const dy = neighbor.y - node.y;
        const lenSq = dx * dx + dy * dy;

        if (lenSq > 0.0001) {
          this.edges.push({
            fromId: nodeId,
            toId: neighborId,
            p1: { x: node.x, y: node.y },
            p2: { x: neighbor.x, y: neighbor.y },
            dx,
            dy,
            lenSq,
            length: Math.sqrt(lenSq)
          });
        }
      }
    }
  },

  /**
   * Checks if coordinate is inside an authorized free-roaming plaza/building
   */
  getFreeRoamZone(x, y) {
    for (const zone of this.freeRoamZones) {
      const d = Math.hypot(zone.x - x, zone.y - y);
      if (d <= zone.radiusPx) {
        return zone;
      }
    }
    return null;
  },

  /**
   * Snaps a raw pixel coordinate to the closest walkable path
   * @param {number} rawPxX - Estimated raw X coordinate in pixels
   * @param {number} rawPxY - Estimated raw Y coordinate in pixels
   * @returns {Object} Matched { x, y, pctX, pctY, isSnapped, distMeters, zone }
   */
  matchLocation(rawPxX, rawPxY) {
    if (!this.isInitialized || this.edges.length === 0) {
      this.init();
      if (this.edges.length === 0) {
        return {
          x: rawPxX,
          y: rawPxY,
          pctX: Number(((rawPxX / this.CANVAS_WIDTH) * 100).toFixed(2)),
          pctY: Number(((rawPxY / this.CANVAS_HEIGHT) * 100).toFixed(2)),
          isSnapped: false,
          distMeters: 0,
          zone: null
        };
      }
    }

    // 1. Check if user is in an open free-roam zone (plazas, restaurant interiors)
    const activeZone = this.getFreeRoamZone(rawPxX, rawPxY);
    let targetX = rawPxX;
    let targetY = rawPxY;
    let isSnapped = false;
    let minPerpDistMeters = 0;
    let closestEdge = null;

    if (activeZone) {
      // In free-roam zone: maintain natural unconstrained movement
      targetX = rawPxX;
      targetY = rawPxY;
      isSnapped = false;
    } else {
      // 2. Outdoor walkway corridor: find closest orthogonal projection
      let minPerpDistPx = Infinity;
      let bestProjection = { x: rawPxX, y: rawPxY };

      for (const edge of this.edges) {
        const u = ((rawPxX - edge.p1.x) * edge.dx + (rawPxY - edge.p1.y) * edge.dy) / edge.lenSq;
        const t = Math.max(0, Math.min(1, u));
        const projX = edge.p1.x + t * edge.dx;
        const projY = edge.p1.y + t * edge.dy;
        const distPx = Math.hypot(rawPxX - projX, rawPxY - projY);

        if (distPx < minPerpDistPx) {
          minPerpDistPx = distPx;
          bestProjection = { x: projX, y: projY };
          closestEdge = edge;
        }
      }

      minPerpDistMeters = minPerpDistPx * this.METERS_PER_PIXEL;
      const snapThresholdPx = this.SNAP_THRESHOLD_METERS * this.PIXELS_PER_METER; // ~28.5 px

      if (minPerpDistPx <= snapThresholdPx) {
        // Snap to path segment
        targetX = bestProjection.x;
        targetY = bestProjection.y;
        isSnapped = true;
      } else {
        // Too far from walkway (e.g. noise placed position deep inside a pool or off-map)
        // Pull it back towards the nearest path with dampening so it never stays in water
        const pullFactor = Math.min(0.85, (minPerpDistPx - snapThresholdPx) / minPerpDistPx);
        targetX = rawPxX + (bestProjection.x - rawPxX) * pullFactor;
        targetY = rawPxY + (bestProjection.y - rawPxY) * pullFactor;
        isSnapped = true;
      }
    }

    // 3. Adaptive Exponential Smoothing (EMA) to prevent visual jumps
    let smoothX = targetX;
    let smoothY = targetY;

    if (this.lastPosition) {
      const jumpDist = Math.hypot(targetX - this.lastPosition.x, targetY - this.lastPosition.y);
      // If jump > 60px (~25m), fast-snap without lag
      const alpha = jumpDist > 60 ? 0.85 : this.ALPHA_SMOOTH;
      smoothX = this.lastPosition.x * (1 - alpha) + targetX * alpha;
      smoothY = this.lastPosition.y * (1 - alpha) + targetY * alpha;
    }

    this.lastPosition = { x: smoothX, y: smoothY };

    const pctX = Number(((smoothX / this.CANVAS_WIDTH) * 100).toFixed(2));
    const pctY = Number(((smoothY / this.CANVAS_HEIGHT) * 100).toFixed(2));

    return {
      x: Math.round(smoothX),
      y: Math.round(smoothY),
      pctX,
      pctY,
      isSnapped,
      distMeters: minPerpDistMeters,
      zone: activeZone ? activeZone.name : null,
      edge: closestEdge ? `${closestEdge.fromId}->${closestEdge.toId}` : null
    };
  },

  /**
   * Resets smoothing cache (e.g. on new device or manual teleport)
   */
  reset() {
    this.lastPosition = null;
  }
};

// Auto-initialize when window loads
if (typeof window !== 'undefined') {
  window.MapMatcher = MapMatcher;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MapMatcher.init());
  } else {
    MapMatcher.init();
  }
}
