import { describe, expect, it } from "vitest";
import { HealthController } from "./health.controller";

describe("HealthController", () => {
  it("répond ok avec une date ISO", () => {
    const result = new HealthController().check();
    expect(result.status).toBe("ok");
    expect(() => new Date(result.time).toISOString()).not.toThrow();
  });
});
