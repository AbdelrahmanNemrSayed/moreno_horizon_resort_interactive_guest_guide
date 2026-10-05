/**
 * Moreno Horizon Spa & Resort - WiFi Indoor Positioning Service (TypeScript Definitions & Implementation)
 * Based on MikroTik RouterOS RSSI data (/interface/wireless/registration-table)
 */

export interface AccessPointConfig {
  id: string;
  bssid: string;
  name: string;
  nameAr?: string;
  x: number;       // Canvas pixels (0..896)
  y: number;       // Canvas pixels (0..1200)
  pctX: number;    // Map percentage (0..100)
  pctY: number;    // Map percentage (0..100)
  floor?: number;
  band?: '2.4GHz' | '5GHz';
  refRssi1m?: number; // RSSI at 1 meter (A in dBm, default: -48.0)
  pathLossN?: number; // Path loss exponent (n, default: 2.75)
  enabled: boolean;
}

export interface IndoorLocationConfig {
  resort: string;
  mapWidth: number;
  mapHeight: number;
  pixelsPerMeter: number;
  metersPerPixel: number;
  defaultModel: {
    refRssi1m: number;
    pathLossN: number;
    minDistanceMeters: number;
    maxDistanceMeters: number;
  };
  accessPoints: AccessPointConfig[];
}

export interface TrilaterationPoint {
  x: number;
  y: number;
  distanceMeters: number;
  weight?: number;
  id?: string;
}

export interface DeviceLocationResult {
  mac: string;
  x: number;
  y: number;
  pctX: number;
  pctY: number;
  accuracyMeters: number;
  apCount?: number;
  method?: string;
  lastSeen: number;
  firstSeen?: number;
  updateCount?: number;
  activeAps?: Array<{ id: string; rssi: number; distM: number }>;
}

export interface MikroTikRegistrationRow {
  '.id'?: string;
  interface?: string;
  'mac-address'?: string;
  mac?: string;
  'signal-strength'?: string;
  signal?: string;
  rssi?: string | number;
  'ap-bssid'?: string;
  bssid?: string;
  'ap-id'?: string;
  ap?: string;
}

// Re-export JS implementation
export { IndoorLocationService, indoorLocationService } from './indoorLocation.js';
