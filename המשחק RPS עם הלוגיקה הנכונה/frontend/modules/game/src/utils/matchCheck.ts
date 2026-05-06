import type { Card } from "@shared/types/game";

export function matchCheck(first: Card, second: Card) {
  return first.pairId === second.pairId;
}
