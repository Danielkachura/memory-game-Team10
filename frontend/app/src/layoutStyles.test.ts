import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(resolve(__dirname, "styles.css"), "utf-8");

describe("fullscreen board layout CSS", () => {
  it("defines a viewport-filling responsive board layout", () => {
    expect(styles).toContain(".squad-layout--boarded");
    expect(styles).toMatch(/\.squad-layout--boarded\s*\{[\s\S]*height:\s*100vh/);
    expect(styles).toMatch(/\.nati-match-layout\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*var\(--sidebar-width\)/);
    expect(styles).toMatch(/\.nati-board-grid\s*\{[\s\S]*grid-template-rows:\s*repeat\(6,\s*minmax\(0,\s*1fr\)\)/);
    expect(styles).toMatch(/\.nati-board-grid\s*\{[\s\S]*aspect-ratio:\s*5\s*\/\s*6/);
    expect(styles).toMatch(/\.nati-board-cell\s*\{[\s\S]*min-height:\s*60px/);
    expect(styles).toMatch(/@media\s*\(max-width:\s*1023px\)[\s\S]*\.nati-match-layout\s*\{[\s\S]*grid-template-columns:\s*1fr/);
  });
});
