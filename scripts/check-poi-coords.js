import '../js/virtual-resort-map.js';
import { resortPois } from '../src/data/pois.js';

const vmap = globalThis.VirtualResortMap;
const mapNodes = vmap.nodes;
const poiToNode = vmap.poiToNodeMap;

console.log('=== POI vs Walkway Node Comparison ===');
for (const poi of resortPois) {
  const nodeKey = poiToNode[poi.id];
  const node = nodeKey ? mapNodes[nodeKey] : null;
  const pxX = (poi.coords.x / 100) * 896;
  const pxY = (poi.coords.y / 100) * 1200;
  if (node) {
    const dx = Math.round(pxX - node.x);
    const dy = Math.round(pxY - node.y);
    const dist = Math.round(Math.hypot(dx, dy));
    console.log(`POI ${poi.id.padEnd(4)} (${poi.nameAr.slice(0, 25).padEnd(25)}): POI=(${Math.round(pxX)},${Math.round(pxY)}) Node=(${node.x},${node.y}) Diff=(${dx},${dy}) Dist=${dist}px`);
  } else {
    console.log(`POI ${poi.id.padEnd(4)} (${poi.nameAr.slice(0, 25).padEnd(25)}): NO NODE KEY in poiToNodeMap!`);
  }
}

console.log('\n=== Nodes in poiToNodeMap not in resortPois ===');
for (const [id, key] of Object.entries(poiToNode)) {
  const exists = resortPois.find(p => p.id === id);
  if (!exists) {
    const node = mapNodes[key];
    console.log(`Missing POI id="${id}": nodeKey="${key}" at (${node ? node.x : '?'}, ${node ? node.y : '?'}) name="${node ? node.name : '?'}"`);
  }
}
