import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("shared Squad RPS types", () => {
  it("replaces obsolete Memory Game types with Squad RPS contracts", () => {
    const source = readFileSync(resolve(__dirname, "../../modules/shared/src/types/game.ts"), "utf8");

    expect(source).toContain('export type Weapon = "rock" | "paper" | "scissors"');
    expect(source).toContain('export type Owner = "player" | "ai"');
    expect(source).toContain("export interface VisiblePiece");
    expect(source).toContain("export interface MatchView");
    expect(source).not.toContain("export interface Card");
    expect(source).not.toContain("export interface GameState");
    expect(source).not.toContain("export type Theme");
    expect(source).not.toContain("export interface Score");
  });
});
