import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getRequestHeader: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@tanstack/react-start/server", () => ({
  getRequestHeader: mocks.getRequestHeader,
}));

vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { rpc: mocks.rpc },
}));

import { callerIp, consumeRateLimits, RateLimitError } from "./rate-limit.server";

describe("rate-limit helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OTP_SECRET = "test-only-rate-limit-secret";
  });

  it("prefers a trusted edge IP header", () => {
    mocks.getRequestHeader.mockImplementation((name: string) => {
      if (name === "cf-connecting-ip") return "203.0.113.10";
      if (name === "x-forwarded-for") return "198.51.100.2, 198.51.100.3";
      return undefined;
    });

    expect(callerIp()).toBe("203.0.113.10");
  });

  it("hashes identifiers before calling the database function", async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: null });

    await consumeRateLimits([
      { action: "guest_journey_phone", value: "+27821234567", windowSeconds: 3600, maxEvents: 3 },
    ]);

    expect(mocks.rpc).toHaveBeenCalledOnce();
    const [, args] = mocks.rpc.mock.calls[0]!;
    expect(args.hashed_key).not.toContain("27821234567");
    expect(args.hashed_key).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects a request when the database limit is exhausted", async () => {
    mocks.rpc.mockResolvedValue({ data: false, error: null });

    await expect(
      consumeRateLimits([
        { action: "guest_invite_ip", value: "203.0.113.10", windowSeconds: 3600, maxEvents: 5 },
      ]),
    ).rejects.toBeInstanceOf(RateLimitError);
  });
});
