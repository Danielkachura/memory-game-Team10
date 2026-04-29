import type { Card, Difficulty } from "@shared";
import { MemoryCard } from "./MemoryCard";

interface GameBoardProps {
  cards: Card[];
  difficulty: Difficulty;
  onFlip: (cardId: string) => void;
  locked: boolean;
}

const GRID_CLASSES: Record<Difficulty, { columns: string; size: string }> = {
  easy: { columns: "grid-cols-4", size: "h-[84px] w-[84px] sm:h-[100px] sm:w-[100px]" },
  medium: { columns: "grid-cols-4", size: "h-[76px] w-[76px] sm:h-[90px] sm:w-[90px]" },
  hard: { columns: "grid-cols-6", size: "h-[56px] w-[56px] sm:h-[80px] sm:w-[80px]" },
};

export function GameBoard({ cards, difficulty, onFlip, locked }: GameBoardProps) {
  const grid = GRID_CLASSES[difficulty];

  return (
    <section className="rounded-md border border-white/10 bg-surface p-lg">
      <div className={`mx-auto grid w-fit ${grid.columns} gap-sm`}>
        {cards.map((card) => (
          <MemoryCard
            key={card.id}
            card={card}
            onFlip={onFlip}
            disabled={locked && !card.isFlipped}
            sizeClassName={grid.size}
          />
        ))}
      </div>
    </section>
  );
}
