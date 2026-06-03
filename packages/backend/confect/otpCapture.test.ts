import { afterEach, describe, expect, test } from "vitest";

import { isOtpCaptureEnabled } from "../convex/http";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env.NODE_ENV = originalEnv.NODE_ENV;
  process.env.OTP_CAPTURE_ENABLED = originalEnv.OTP_CAPTURE_ENABLED;
  process.env.SITE_URL = originalEnv.SITE_URL;
});

describe("isOtpCaptureEnabled", () => {
  test("is enabled in local non-production", () => {
    process.env.NODE_ENV = "development";
    process.env.OTP_CAPTURE_ENABLED = undefined;
    process.env.SITE_URL = "https://churchtask.app";

    expect(isOtpCaptureEnabled()).toBe(true);
  });

  test("is disabled in production by default", () => {
    process.env.NODE_ENV = "production";
    process.env.OTP_CAPTURE_ENABLED = undefined;
    process.env.SITE_URL = "https://churchtask.app";

    expect(isOtpCaptureEnabled()).toBe(false);
  });

  test("allows explicitly enabled e2e capture only for local site urls", () => {
    process.env.NODE_ENV = "production";
    process.env.OTP_CAPTURE_ENABLED = "1";
    process.env.SITE_URL = "http://localhost:2101";

    expect(isOtpCaptureEnabled()).toBe(true);

    process.env.SITE_URL = "https://churchtask.app";

    expect(isOtpCaptureEnabled()).toBe(false);
  });
});
