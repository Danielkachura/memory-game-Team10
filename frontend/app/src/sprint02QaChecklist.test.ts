import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(__dirname, "../../..");

function readRepoFile(path: string) {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("Sprint 02 QA checklist automation", () => {
  it("Task 1 covers hidden-info security scenarios", () => {
    const backendTests = readRepoFile("backend/python_api/tests/test_app.py");

    expect(backendTests).toContain("test_dead_enemy_role_stays_hidden_until_match_ends");
    expect(backendTests).toContain("test_own_dead_piece_shows_role");
    expect(backendTests).toContain("test_enemy_weapon_hidden_after_duel");
  });
});
