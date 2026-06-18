import { Chess, type Square } from 'chess.js';

export type DailyPuzzle = {
  id: string;
  date: string;
  title: string;
  fen: string;
  solution: { from: Square; to: Square; promotion?: 'q' };
  hint: string;
};

const dailyPuzzles: DailyPuzzle[] = [
  { id: 'dp1', date: '2026-06-18', title: 'Fork in the Center', fen: 'r1bqkb1r/pppp1ppp/2n5/4N3/2B1n3/8/PPPP1PPP/RNBQK2R w KQkq - 0 5', solution: { from: 'e5', to: 'f7' }, hint: 'Attack two pieces at once.' },
  { id: 'dp2', date: '2026-06-19', title: 'Queen Trap', fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', solution: { from: 'd1', to: 'e2' }, hint: 'Defend the vulnerable square.' },
  { id: 'dp3', date: '2026-06-20', title: 'Back Rank Mate', fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', solution: { from: 'a1', to: 'a8' }, hint: 'The rook delivers checkmate along the file.' },
  { id: 'dp4', date: '2026-06-21', title: 'Bishop Breakthrough', fen: 'r3k2r/pppq1ppp/2n1bn2/2B1p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 w kq - 0 8', solution: { from: 'c5', to: 'd6' }, hint: 'Break through the pawn chain.' },
  { id: 'dp5', date: '2026-06-22', title: 'Pawn Promotion', fen: '8/6P1/8/8/8/8/8/K6k w - - 0 1', solution: { from: 'g7', to: 'g8', promotion: 'q' }, hint: 'Promote with checkmate.' },
];

export function getTodayPuzzle(): DailyPuzzle {
  const today = new Date().toISOString().split('T')[0];
  const found = dailyPuzzles.find(p => p.date === today);
  if (found) return found;
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return dailyPuzzles[dayOfYear % dailyPuzzles.length];
}
