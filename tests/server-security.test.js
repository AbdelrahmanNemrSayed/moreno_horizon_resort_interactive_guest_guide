/**
 * Unit Tests for Security and Environment Config
 */

import { test, expect } from "vitest";
import envConfig from "../config/env.js";

test("EnvConfig - Critical security fields are exposed", () => {
  expect(envConfig.security).toBeTruthy();
  expect(typeof envConfig.port).toBe("number");
  expect(envConfig.security.adminPassword).toBeTruthy();
  expect(envConfig.security.jwtSecret).toBeTruthy();
  expect(envConfig.security.mikrotikFeedKey).toBeTruthy();
});

test("EnvConfig - MikroTik connection settings are configured", () => {
  expect(envConfig.mikrotik).toBeTruthy();
  expect(typeof envConfig.mikrotik.port).toBe("number");
  expect(typeof envConfig.mikrotik.pollIntervalMs).toBe("number");
});

test("EnvConfig - Port is within valid range", () => {
  expect(envConfig.port).toBeGreaterThanOrEqual(1);
  expect(envConfig.port).toBeLessThanOrEqual(65535);
});

test("EnvConfig - Environment is recognized", () => {
  expect(["development", "production", "test"]).toContain(envConfig.env);
});
