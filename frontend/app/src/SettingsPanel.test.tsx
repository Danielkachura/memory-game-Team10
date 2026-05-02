import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { SettingsPanel } from "../../modules/game/src/components/SettingsPanel";
import { audioManager } from "../../modules/game/src/utils/audioManager";

describe("SettingsPanel", () => {
  afterEach(() => {
    window.localStorage.clear();
    audioManager.setMode("all");
  });

  it("stores the selected audio mode", async () => {
    const user = userEvent.setup();
    render(<SettingsPanel />);

    await user.click(screen.getByRole("button", { name: /Settings/i }));
    await user.click(screen.getByRole("radio", { name: /Only SFX/i }));

    expect(window.localStorage.getItem("squad-rps-audio-mode")).toBe("sfx");
    expect(screen.getByRole("radio", { name: /Only SFX/i })).toBeChecked();
  });
});
