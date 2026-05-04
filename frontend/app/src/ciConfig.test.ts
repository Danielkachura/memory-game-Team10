import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("CI configuration", () => {
  it("defines test workflow jobs and README status badge", () => {
    const repoRoot = resolve(__dirname, "../../..");
    const workflowPath = resolve(repoRoot, ".github/workflows/test.yml");
    const readme = readFileSync(resolve(repoRoot, "README.md"), "utf8");

    expect(existsSync(workflowPath)).toBe(true);
    const workflow = readFileSync(workflowPath, "utf8");
    expect(workflow).toContain("backend-tests:");
    expect(workflow).toContain("frontend-tests:");
    expect(workflow).toContain("e2e-tests:");
    expect(workflow).toContain("pytest --cov=python_api");
    expect(workflow).toContain("vitest --coverage");
    expect(workflow).toContain("playwright test");
    expect(readme).toContain("actions/workflows/test.yml/badge.svg");
  });
});
