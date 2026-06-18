export type OpeningEntry = {
  moves: string;
  name: string;
  eco: string;
  winRate: number;
};

export const openingBook: OpeningEntry[] = [
  { moves: 'e4', name: 'King\'s Pawn', eco: 'B00', winRate: 54 },
  { moves: 'e4 e5', name: 'Open Game', eco: 'C20', winRate: 52 },
  { moves: 'e4 e5 Nf3 Nc6', name: 'Italian Game', eco: 'C50', winRate: 53 },
  { moves: 'e4 e5 Nf3 Nc6 Bb5', name: 'Ruy Lopez', eco: 'C60', winRate: 55 },
  { moves: 'e4 e5 Nf3 Nf6', name: 'Petrov Defense', eco: 'C42', winRate: 48 },
  { moves: 'e4 c5', name: 'Sicilian Defense', eco: 'B20', winRate: 50 },
  { moves: 'e4 c5 Nf3 d6', name: 'Sicilian Classical', eco: 'B56', winRate: 51 },
  { moves: 'e4 c5 Nf3 Nc6', name: 'Sicilian Open', eco: 'B30', winRate: 52 },
  { moves: 'e4 e6', name: 'French Defense', eco: 'C00', winRate: 49 },
  { moves: 'e4 e6 d4 d5', name: 'French Advance', eco: 'C02', winRate: 50 },
  { moves: 'e4 c6', name: 'Caro-Kann', eco: 'B10', winRate: 50 },
  { moves: 'e4 d5', name: 'Scandinavian', eco: 'B01', winRate: 47 },
  { moves: 'd4', name: 'Queen\'s Pawn', eco: 'D00', winRate: 55 },
  { moves: 'd4 d5', name: 'Queen Pawn Game', eco: 'D02', winRate: 53 },
  { moves: 'd4 d5 c4', name: 'Queen\'s Gambit', eco: 'D06', winRate: 56 },
  { moves: 'd4 d5 c4 e6', name: 'QGD Orthodox', eco: 'D30', winRate: 54 },
  { moves: 'd4 Nf6', name: 'Indian Defense', eco: 'E00', winRate: 52 },
  { moves: 'd4 Nf6 c4 g6', name: 'King\'s Indian', eco: 'E70', winRate: 51 },
  { moves: 'd4 Nf6 c4 e6', name: 'Nimzo-Indian', eco: 'E20', winRate: 52 },
  { moves: 'Nf3', name: 'Reti Opening', eco: 'A04', winRate: 53 },
  { moves: 'c4', name: 'English Opening', eco: 'A10', winRate: 54 },
  { moves: 'f4', name: 'Bird\'s Opening', eco: 'A02', winRate: 46 },
  { moves: 'g3', name: 'King\'s Fianchetto', eco: 'A00', winRate: 50 },
  { moves: 'b3', name: 'Nimzo-Larsen', eco: 'A01', winRate: 48 },
];

export function findOpening(moveHistory: string[]): OpeningEntry | null {
  const pgn = moveHistory.join(' ');
  let best: OpeningEntry | null = null;
  let bestLen = 0;
  for (const entry of openingBook) {
    if (pgn.startsWith(entry.moves) && entry.moves.split(' ').length > bestLen) {
      best = entry;
      bestLen = entry.moves.split(' ').length;
    }
  }
  return best;
}
