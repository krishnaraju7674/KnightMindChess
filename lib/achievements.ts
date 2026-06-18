export type Achievement = {
  id: string;
  title: string;
  desc: string;
  emoji: string;
  check: (stats: { games: number; wins: number; puzzlesSolved: number; rating: number; streak: number }) => boolean;
};

export const achievements: Achievement[] = [
  { id: 'first-game', title: 'First Moves', desc: 'Play your first game', emoji: '\u2654', check: (s) => s.games >= 1 },
  { id: 'ten-games', title: 'Getting Started', desc: 'Play 10 games', emoji: '\u2656', check: (s) => s.games >= 10 },
  { id: 'fifty-games', title: 'Dedicated', desc: 'Play 50 games', emoji: '\u2656', check: (s) => s.games >= 50 },
  { id: 'first-win', title: 'First Blood', desc: 'Win your first game', emoji: '\u2655', check: (s) => s.wins >= 1 },
  { id: 'ten-wins', title: 'Warrior', desc: 'Win 10 games', emoji: '\u2655', check: (s) => s.wins >= 10 },
  { id: 'puzzle-master', title: 'Puzzle Master', desc: 'Solve 5 puzzles', emoji: '\u2658', check: (s) => s.puzzlesSolved >= 5 },
  { id: 'fifteen-puzzles', title: 'Tactician', desc: 'Solve 15 puzzles', emoji: '\u2658', check: (s) => s.puzzlesSolved >= 15 },
  { id: 'thousand-rating', title: 'Four Digits', desc: 'Reach 1000 rating', emoji: '\u2659', check: (s) => s.rating >= 1000 },
  { id: 'twelve-hundred', title: 'Rising Star', desc: 'Reach 1200 rating', emoji: '\u2659', check: (s) => s.rating >= 1200 },
  { id: 'three-day-streak', title: 'Consistent', desc: '3 day streak', emoji: '\u2657', check: (s) => s.streak >= 3 },
  { id: 'seven-day-streak', title: 'Week Warrior', desc: '7 day streak', emoji: '\u2657', check: (s) => s.streak >= 7 },
];

export function checkAchievements(prev: string[], stats: { games: number; wins: number; puzzlesSolved: number; rating: number; streak: number }): string[] {
  return achievements.filter(a => !prev.includes(a.id) && a.check(stats)).map(a => a.id);
}
