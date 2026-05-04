import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const packageJson = JSON.parse(readFileSync(resolve(__dirname, "../package.json"), "utf-8"));
const viteConfig = readFileSync(resolve(__dirname, "../vite.config.ts"), "utf-8");

describe("coverage configuration", () => {
  it("configures Vitest v8 coverage with 80 percent thresholds", () => {
    expect(packageJson.devDependencies["@vitest/coverage-v8"]).toBeDefined();
    expect(viteConfig).toContain("coverage:");
    expect(viteConfig).toContain("provider: \"v8\"");
    expect(viteConfig).toContain("reporter: [\"text\", \"html\"]");
    expect(viteConfig).toContain("lines: 80");
    expect(viteConfig).toContain("branches: 80");
    expect(viteConfig).toContain("functions: 80");
    expect(viteConfig).toContain("statements: 80");
  });
});
