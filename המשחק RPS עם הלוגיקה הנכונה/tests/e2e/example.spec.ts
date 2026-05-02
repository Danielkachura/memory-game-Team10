import { expect, test } from "../../frontend/node_modules/@playwright/test/index.js";

const matchView = {
  matchId: "match-e2e",
  phase: "player_turn",
  currentTurn: "player",
  difficulty: "medium",
  message: "Your turn. Pick an attacker and an enemy target.",
  board: [
    {
      id: "player-1",
      owner: "player",
      row: 1,
      col: 1,
      alive: true,
      label: "Captain Quartz",
      weapon: "rock",
      weaponIcon: "🪨",
      role: "flag",
      roleIcon: "🚩",
      silhouette: false,
    },
    {
      id: "ai-1",
      owner: "ai",
      row: 6,
      col: 1,
      alive: true,
      label: "Hidden Operative",
      weapon: null,
      weaponIcon: null,
      role: null,
      roleIcon: null,
      silhouette: true,
    },
  ],
  stats: {
    durationSeconds: 4,
    playerDuelsWon: 0,
    playerDuelsLost: 0,
    tieSequences: 0,
    decoyAbsorbed: 0,
  },
  revealEndsAt: Date.now() / 1000 + 20,
  duel: null,
  result: null,
};

test.describe("Squad RPS MVP", () => {
  test("loads the setup screen", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Squad RPS - Team 10/i);
    await expect(page.getByRole("heading", { name: /Flag hunts, decoys, and hidden weapons/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Start Match" })).toBeVisible();
  });

  test("starts a mocked match and renders the battle board", async ({ page }) => {
    await page.route("**/api/match/create", async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify(matchView) });
    });

    await page.goto("/");
    await page.getByRole("button", { name: "Start Match" }).click();

    await expect(page.getByTestId("battle-board")).toBeVisible();
    await expect(page.getByLabel("Captain Quartz 🪨")).toBeVisible();
    await expect(page.getByLabel(/Enemy silhouette/i)).toBeVisible();
  });
});
