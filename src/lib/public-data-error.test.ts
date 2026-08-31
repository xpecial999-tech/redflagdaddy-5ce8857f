import { describe, expect, it, vi } from "vitest";
import { PUBLIC_DATA_FAILURE_MESSAGE, throwPublicDataError } from "./public-data-error";

describe("public data errors", () => {
  it("logs only a bounded error code and returns a generic public message", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() => throwPublicDataError({ code: "DB_PRIVATE_DETAIL" }, "load invite")).toThrow(
      PUBLIC_DATA_FAILURE_MESSAGE,
    );
    expect(log).toHaveBeenCalledWith("[public-data] load invite failed", {
      code: "DB_PRIVATE_DETAIL",
    });
    expect(JSON.stringify(log.mock.calls)).not.toContain("password");
    log.mockRestore();
  });
});
