import { useRef, type RefObject } from "react";
import { Difficulty } from "@shared/types";
import { FallingLeavesBackground } from "./FallingLeavesBackground";
import { VideoBackground } from "./VideoBackground";

const GAME_BACKGROUND_OVERLAY = "linear-gradient(rgba(12, 16, 10, 0.56), rgba(12, 16, 10, 0.86))";

const LOGO_IMAGE = "/game_logo_squad_rps.png";
const START_BUTTON_IMAGE = "/ui_start_button.png";
const HOW_TO_PLAY_BUTTON_IMAGE = "/ui_how_to_play_button.png";
const SETTINGS_BUTTON_IMAGE = "/ui_settings_button.png";
const LEADERBOARD_BUTTON_IMAGE = "/ui_leaderboard_button.png";
const DIFFICULTY_TITLE_IMAGE = "/ui_title_choose_difficulty.png";

const DIFFICULTY_CARD_IMAGES: Record<Difficulty, string> = {
  easy: "/ui_difficulty_easy.png",
  medium: "/ui_difficulty_medium.png",
  hard: "/ui_difficulty_hard.png",
};

const DIFFICULTY_GLOW: Record<Difficulty, string> = {
  easy: "rgba(127, 255, 64, 0.42)",
  medium: "rgba(255, 186, 60, 0.4)",
  hard: "rgba(255, 93, 93, 0.42)",
};

const ORDERED_DIFFICULTIES: Difficulty[] = ["medium", "easy", "hard"];

const RULES = [
  "Rock beats Scissors | Paper beats Rock | Scissors beats Paper",
  "Find and defeat the enemy Flag-bearer to win",
  "Decoy absorbs every attack, but the attacker can still lose",
  "Memorize weapons during the 10-second reveal phase",
] as const;

interface StartScreenProps {
  difficulties: { id: Difficulty; label: string; detail: string }[];
  selected: Difficulty;
  onSelect: (d: Difficulty) => void;
  onStart: () => void;
  loading: boolean;
}

function showFallbackText(target: EventTarget | null, selector: string) {
  const image = target as HTMLImageElement | null;
  image?.style && (image.style.display = "none");

  const fallback = image?.parentElement?.querySelector(selector) as HTMLElement | null;
  if (fallback) {
    fallback.style.opacity = "1";
    fallback.style.transform = "translateY(0)";
  }
}

function scrollToSection(ref: RefObject<HTMLElement | null>) {
  ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
}

export function StartScreen({ difficulties, selected, onSelect, onStart, loading }: StartScreenProps) {
  const rulesRef = useRef<HTMLElement | null>(null);
  const difficultyRef = useRef<HTMLElement | null>(null);

  const orderedDifficulties = ORDERED_DIFFICULTIES
    .map((id) => difficulties.find((difficulty) => difficulty.id === id))
    .filter((difficulty): difficulty is StartScreenProps["difficulties"][number] => Boolean(difficulty));

  return (
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
        backgroundColor: "var(--color-board-bg)",
        overflowX: "hidden",
      }}
    >
      <VideoBackground overlay={GAME_BACKGROUND_OVERLAY} />
      <FallingLeavesBackground />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 50% 12%, rgba(255, 228, 170, 0.16), transparent 26%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          width: "min(1180px, 100%)",
          margin: "0 auto",
          padding: "clamp(8px, 1.1vw, 12px) clamp(14px, 2vw, 24px) clamp(6px, 0.8vw, 10px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          gap: "clamp(4px, 0.7vw, 8px)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "clamp(2px, 0.45vw, 5px)",
          }}
        >
          <img
            src={LOGO_IMAGE}
            alt="Squad RPS"
            style={{
              display: "block",
              width: "clamp(300px, 36vw, 540px)",
              objectFit: "contain",
              filter: "drop-shadow(0 18px 38px rgba(0,0,0,0.35))",
            }}
            onError={(e) => {
              const image = e.target as HTMLImageElement;
              image.style.display = "none";
              const fallback = image.parentElement?.querySelector("[data-logo-fallback]") as HTMLElement | null;
              if (fallback) {
                fallback.style.opacity = "1";
              }
            }}
          />

          <div
            data-logo-fallback="true"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(2.2rem, 7vw, 4rem)",
              letterSpacing: "0.06em",
              color: "#F3F6FF",
              textShadow: "0 8px 20px rgba(0,0,0,0.35)",
              opacity: 0,
              transition: "opacity 0.18s ease",
            }}
          >
            SQUAD RPS
          </div>

          <div
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "clamp(0.76rem, 0.95vw, 0.9rem)",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.84)",
              textShadow: "0 2px 8px rgba(0,0,0,0.34)",
              textAlign: "center",
            }}
          >
            Rock | Paper | Scissors | Flag | Decoy
          </div>

          <section
            ref={rulesRef}
            style={{
              width: "min(700px, 100%)",
              padding: "10px 14px",
              borderRadius: "18px",
              background: "linear-gradient(180deg, rgba(12,16,12,0.56), rgba(8,10,8,0.42))",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(8px)",
              boxShadow: "0 18px 40px rgba(0,0,0,0.24)",
              display: "flex",
              flexDirection: "column",
              gap: "3px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(0.92rem, 1.1vw, 1.02rem)",
                color: "#F4D377",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              How To Play
            </div>

            {RULES.map((rule) => (
              <div
                key={rule}
                style={{
                  padding: "5px 10px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  fontFamily: "var(--font-ui)",
                  fontSize: "0.68rem",
                  lineHeight: "1.22",
                  color: "var(--color-text-muted)",
                }}
              >
                {rule}
              </div>
            ))}
          </section>

          <section
            ref={difficultyRef}
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0px",
            }}
          >
            <div style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center" }}>
              <img
                src={DIFFICULTY_TITLE_IMAGE}
                alt="Choose difficulty"
                style={{
                  display: "block",
                  width: "clamp(260px, 28vw, 360px)",
                  objectFit: "contain",
                  filter: "drop-shadow(0 10px 22px rgba(0,0,0,0.28))",
                  marginTop: "-18px",
                  marginBottom: "-34px",
                }}
                onError={(e) => {
                  showFallbackText(e.target, "[data-difficulty-title-fallback]");
                }}
              />

              <div
                data-difficulty-title-fallback="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-heading)",
                  fontSize: "1.14rem",
                  letterSpacing: "0.12em",
                  color: "#F4D377",
                  opacity: 0,
                  transform: "translateY(6px)",
                  transition: "opacity 0.16s ease, transform 0.16s ease",
                }}
              >
                CHOOSE DIFFICULTY
              </div>
            </div>

            <div
              style={{
                width: "100%",
                maxWidth: "920px",
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "0px",
                alignItems: "start",
                justifyItems: "center",
              }}
            >
              {orderedDifficulties.map((difficulty) => {
                const isSelected = selected === difficulty.id;
                const glow = DIFFICULTY_GLOW[difficulty.id];

                return (
                  <button
                    key={difficulty.id}
                    type="button"
                    onClick={() => onSelect(difficulty.id)}
                    aria-pressed={isSelected}
                    aria-label={difficulty.label}
                    style={{
                      position: "relative",
                      width: "100%",
                      maxWidth: "345px",
                      justifySelf: "center",
                      padding: 0,
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      overflow: "visible",
                      transform: isSelected ? "translateY(-3px) scale(1.02)" : "translateY(0) scale(1)",
                      transition: "transform 0.16s ease, filter 0.16s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (selected === difficulty.id) return;
                      e.currentTarget.style.transform = "translateY(-3px) scale(1.01)";
                    }}
                    onMouseLeave={(e) => {
                      if (selected === difficulty.id) return;
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <img
                      src={DIFFICULTY_CARD_IMAGES[difficulty.id]}
                      alt=""
                      aria-hidden="true"
                      style={{
                        display: "block",
                        width: "100%",
                        objectFit: "contain",
                        marginTop: "-52px",
                        marginBottom: "-26px",
                        marginLeft: "-28px",
                        marginRight: "-28px",
                        filter: isSelected ? `drop-shadow(0 14px 26px ${glow}) brightness(1.06)` : "drop-shadow(0 10px 18px rgba(0,0,0,0.2))",
                        transition: "filter 0.16s ease",
                      }}
                      onError={(e) => {
                        showFallbackText(e.target, `[data-difficulty-fallback="${difficulty.id}"]`);
                      }}
                    />

                    <div
                      data-difficulty-fallback={difficulty.id}
                      style={{
                        position: "absolute",
                        inset: 0,
                        padding: "18px 16px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        color: "#FFFFFF",
                        opacity: 0,
                        transform: "translateY(6px)",
                        transition: "opacity 0.16s ease, transform 0.16s ease",
                      }}
                    >
                      <span style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", letterSpacing: "0.08em" }}>
                        {difficulty.label}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-ui)",
                          fontSize: "0.72rem",
                          lineHeight: "1.45",
                          textAlign: "center",
                        }}
                      >
                        {difficulty.detail}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div
              style={{
                width: "100%",
                maxWidth: "920px",
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                alignItems: "start",
                marginTop: "-4px",
              }}
            >
              <button
                type="button"
                onClick={onStart}
                disabled={loading}
                aria-label={loading ? "Preparing match" : "Start game"}
                style={{
                  position: "relative",
                  gridColumn: "2",
                  justifySelf: "center",
                  padding: 0,
                  background: "transparent",
                  border: "none",
                  cursor: loading ? "wait" : "pointer",
                  opacity: loading ? 0.72 : 1,
                  overflow: "visible",
                  transition: "transform 0.14s ease, opacity 0.14s ease",
                }}
                onMouseEnter={(e) => {
                  if (loading) return;
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  if (loading) return;
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <img
                  src={START_BUTTON_IMAGE}
                  alt=""
                  aria-hidden="true"
                style={{
                  display: "block",
                  width: "clamp(255px, 22vw, 330px)",
                  objectFit: "contain",
                  marginTop: "-26px",
                  marginBottom: "-38px",
                    filter: loading ? "grayscale(0.15) brightness(0.92)" : "drop-shadow(0 0 16px rgba(205, 255, 92, 0.24))",
                  }}
                  onError={(e) => {
                    showFallbackText(e.target, "[data-start-fallback]");
                  }}
                />

                <span
                  data-start-fallback="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-heading)",
                    fontSize: loading ? "0.96rem" : "1.1rem",
                    letterSpacing: "0.14em",
                    color: "rgba(255,255,255,0.95)",
                    opacity: loading ? 1 : 0,
                    transform: "translateY(6px)",
                    textShadow: "0 2px 10px rgba(0,0,0,0.4)",
                    pointerEvents: "none",
                    transition: "opacity 0.16s ease, transform 0.16s ease",
                  }}
                >
                  {loading ? "PREPARING..." : "START"}
                </span>
              </button>
            </div>
          </section>
        </div>

        <footer
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: "8px",
            flexWrap: "wrap",
            marginTop: "auto",
            paddingTop: "2px",
          }}
        >
          <button
            type="button"
            aria-label="How to play"
            onClick={() => scrollToSection(rulesRef)}
            style={{
              padding: 0,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              transition: "transform 0.14s ease, filter 0.14s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.filter = "drop-shadow(0 10px 18px rgba(0,0,0,0.28))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.filter = "none";
            }}
          >
            <img
              src={HOW_TO_PLAY_BUTTON_IMAGE}
              alt="How to play"
              style={{
                display: "block",
                width: "clamp(150px, 13vw, 200px)",
                objectFit: "contain",
              }}
            />
          </button>

          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              aria-label="Settings"
              onClick={() => scrollToSection(difficultyRef)}
              style={{
                padding: 0,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                transition: "transform 0.14s ease, filter 0.14s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.filter = "drop-shadow(0 10px 18px rgba(0,0,0,0.28))";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.filter = "none";
              }}
            >
              <img
                src={SETTINGS_BUTTON_IMAGE}
                alt="Settings"
                style={{
                  display: "block",
                  width: "clamp(150px, 13vw, 200px)",
                  objectFit: "contain",
                }}
              />
            </button>

            <button
              type="button"
              aria-label="Leaderboard"
              title="Leaderboard UI"
              style={{
                padding: 0,
                background: "transparent",
                border: "none",
                cursor: "default",
                transition: "transform 0.14s ease, filter 0.14s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.filter = "drop-shadow(0 10px 18px rgba(0,0,0,0.28))";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.filter = "none";
              }}
            >
              <img
                src={LEADERBOARD_BUTTON_IMAGE}
                alt="Leaderboard"
                style={{
                  display: "block",
                  width: "clamp(150px, 14vw, 210px)",
                  objectFit: "contain",
                }}
              />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
