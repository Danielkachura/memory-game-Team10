import { expect, test } from "../../frontend/node_modules/@playwright/test/index.js";

async function finishEasyBoard(page: import("../../frontend/node_modules/@playwright/test/index.js").Page) {
  await page.evaluate(async () => {
    type TestApi = {
      completeGame: () => void;
      getState: () => { status: string };
    };

    const testApi = (window as Window & { __MEMORY_GAME_TEST__?: TestApi }).__MEMORY_GAME_TEST__;
    if (!testApi) {
      throw new Error("Missing E2E test API.");
    }

    testApi.completeGame();

    const startedAt = Date.now();
    while (testApi.getState().status !== "won") {
      if (Date.now() - startedAt > 2000) {
        throw new Error("Game did not reach the won state in time.");
      }

      await new Promise((resolve) => window.setTimeout(resolve, 50));
    }
  });
}

test.describe("Memory Game MVP", () => {
  test("loads the setup screen", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Memory Game - Team 10/i);
    await expect(page.getByRole("heading", { name: "Memory Game" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Start New Game" })).toBeVisible();
  });

  test("can start an easy game and finish the board", async ({ page }) => {
    await page.goto("/?deck=ordered&e2e=1");
    await page.getByRole("button", { name: "Start New Game" }).click();

    await expect(page.getByText("Moves")).toBeVisible();
    await finishEasyBoard(page);

    await expect(page.getByTestId("win-screen")).toContainText("Board Cleared");
    await expect(page.getByRole("button", { name: "Play Again" })).toBeVisible();
  });

  test("shows fallback hint text when Claude is unavailable", async ({ page }) => {
    await page.route("**/api/claude", async (route) => {
      await route.fulfill({ status: 500, body: JSON.stringify({ error: "forced failure" }) });
    });

    await page.goto("/");
    await page.getByRole("button", { name: "Start New Game" }).click();
    await page.getByRole("button", { name: "Hint" }).click();

    await expect(page.getByTestId("hint-panel")).toContainText(/memory|edges|freshest/i);
  });
});
