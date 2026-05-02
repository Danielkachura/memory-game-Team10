import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGame } from "@game/hooks/useGame";

// Simple smoke test for useGame hook
describe("useGame smoke test", () => {
  it("should initialize with setup phase", () => {
    const { result } = renderHook(() => useGame());
    expect(result.current.phase).toBe("setup");
    expect(result.current.match).toBeNull();
  });

  it("should have startMatch function", () => {
    const { result } = renderHook(() => useGame());
    expect(typeof result.current.startMatch).toBe("function");
  });
});
