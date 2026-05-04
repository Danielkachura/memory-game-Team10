import type { MemoryCardData } from "../utils/buildDeck";

interface MemoryCardProps {
  card: MemoryCardData;
  onFlip: (cardId: string) => void;
  sizeClassName: string;
  disabled: boolean;
}

export function MemoryCard({ card, onFlip, sizeClassName, disabled }: MemoryCardProps) {
  const revealed = card.isFlipped || card.isMatched;

  return (
    <button
      type="button"
      data-testid={`card-${card.id}`}
      data-pair-id={card.pairId}
      aria-label={`Card ${card.id}, ${card.isMatched ? "matched" : revealed ? "face up" : "face down"}`}
      aria-disabled={card.isMatched || disabled}
      onClick={() => onFlip(card.id)}
      disabled={card.isMatched || disabled}
      className={`${sizeClassName} rounded-md border text-center transition-transform duration-300 ${
        card.isMatched
          ? "border-success bg-card-face shadow-[0_0_24px_rgba(123,211,137,0.18)]"
          : revealed
            ? "border-white/10 bg-card-face"
            : "border-transparent bg-card-back hover:scale-[1.02]"
      }`}
    >
      <span className={`font-emoji text-3xl ${revealed ? "opacity-100" : "opacity-0"}`}>
        {card.content}
      </span>
    </button>
  );
}
