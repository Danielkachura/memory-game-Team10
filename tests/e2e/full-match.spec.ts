import { expect, test } from "../../frontend/app/node_modules/@playwright/test/index.js";

const playerPiece = {
  id: "player-1",
  owner: "player",
  row: 2,
  col: 1,
  alive: true,
  label: "Rock flag",
  weapon: "rock",
  weaponIcon: "R",
  role: "flag",
  roleIcon: "F",
  silhouette: false,
};

const enemyPiece = {
  id: "ai-1",
  owner: "ai",
  row: 3,
  col: 1,
  alive: true,
  label: "Hidden Operative",
  weapon: null,
  weaponIcon: null,
  role: null,
  roleIcon: null,
  silhouette: true,
};

function view(overrides = {}) {
  return {
    matchId: "full-match",
    phase: "reveal",
    mode: "ai",
    viewer: "player",
    currentTurn: "player",
    difficulty: "medium",
    message: "Memorize the enemy squad before the reveal timer ends.",
    board: [playerPiece, enemyPiece],
    stats: {
      durationSeconds: 4,
      playerDuelsWon: 0,
      playerDuelsLost: 0,
      tieSequences: 0,
      decoyAbsorbed: 0,
    },
    revealEndsAt: Date.now() / 1000 + 30,
    duel: null,
    result: null,
    eventLog: [{ turn: 1, message: "Match created." }],
    ...overrides,
  };
}

test("complete match flow from reveal to victory", async ({ page }) => {
  await page.route("**/api/match/create", async (route) => {
    await route.fulfill({ status: 200, body: JSON.stringify(view()) });
  });
  await page.route("**/api/match/full-match/reveal/complete", async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify(view({
        phase: "player_turn",
        message: "Your turn. Pick an attacker and an enemy target.",
      })),
    });
  });
  await page.route("**/api/match/full-match/turn/player-move", async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify(view({
        phase: "ai_turn",
        currentTurn: "ai",
        message: "Claude is thinking.",
        board: [{ ...playerPiece, row: 3 }, enemyPiece],
      })),
    });
  });
  await page.route("**/api/match/full-match/turn/ai-move", async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify(view({
        phase: "player_turn",
        message: "Your turn. Attack the adjacent enemy.",
        board: [{ ...playerPiece, row: 4 }, { ...enemyPiece, row: 5 }],
      })),
    });
  });
  await page.route("**/api/match/full-match/turn/player-attack", async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify(view({
        phase: "finished",
        currentTurn: "none",
        message: "Enemy flag captured.",
        board: [{ ...playerPiece, row: 4 }, { ...enemyPiece, row: 5, alive: false, label: "Paper flag", role: "flag", roleIcon: "F" }],
        duel: {
          attackerId: "player-1",
          attackerName: "Rock flag",
          attackerWeapon: "rock",
          defenderId: "ai-1",
          defenderName: "Scissors flag",
          defenderWeapon: "scissors",
          winner: "attacker",
          tie: false,
          decoyAbsorbed: false,
          eliminatedId: "ai-1",
          revealedRole: "flag",
        },
        result: { winner: "player", reason: "Enemy flag captured." },
      })),
    });
  });

  await page.goto("/");
  const soloButton = page.getByRole("button", { name: /Play vs Claude/i });
  if (await soloButton.count()) {
    await soloButton.click();
  }
  await page.getByRole("button", { name: "Start Match" }).click();

  if (await page.getByText(/weapon reveal/i).count()) {
    await page.evaluate(() => (window as any).__SQUAD_RPS_TEST__?.finishReveal());
  }
  await expect(page.getByText(/player turn/i)).toBeVisible();

  await page.getByLabel(/Rock flag/i).click();
  await page.getByLabel(/Enemy silhouette/i).click();

  await expect(page.getByTestId("result-panel")).toBeVisible();
  await expect(page.getByRole("heading", { name: /You Win/i })).toBeVisible();
});
