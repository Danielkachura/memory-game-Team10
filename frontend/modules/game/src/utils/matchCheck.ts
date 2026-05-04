import type { MemoryCardData } from "./buildDeck";

export function matchCheck(first: Pick<MemoryCardData, "pairId">, second: Pick<MemoryCardData, "pairId">) {
  return first.pairId === second.pairId;
}
