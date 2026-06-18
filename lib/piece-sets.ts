export type PieceSet = {
  name: string;
  pieces: Record<string, string>;
};

const standard: Record<string, string> = {
  wp: '\u2659', wn: '\u2658', wb: '\u2657', wr: '\u2656', wq: '\u2655', wk: '\u2654',
  bp: '\u265F', bn: '\u265E', bb: '\u265D', br: '\u265C', bq: '\u265B', bk: '\u265A',
};

const outlined: Record<string, string> = {
  wp: '\u265F', wn: '\u265E', wb: '\u265D', wr: '\u265C', wq: '\u265B', wk: '\u265A',
  bp: '\u2659', bn: '\u2658', bb: '\u2657', br: '\u2656', bq: '\u2655', bk: '\u2654',
};

const circled: Record<string, string> = {
  wp: '\u24D0', wn: '\u24D3', wb: '\u24D2', wr: '\u24D9', wq: '\u24D8', wk: '\u24D6',
  bp: '\u24D0', bn: '\u24D3', bb: '\u24D2', br: '\u24D9', bq: '\u24D8', bk: '\u24D6',
};

export const pieceSets: PieceSet[] = [
  { name: 'Standard', pieces: standard },
  { name: 'Outlined', pieces: outlined },
  { name: 'Circled', pieces: circled },
];

export function getPieceSet(name: string): PieceSet {
  return pieceSets.find(p => p.name === name) ?? pieceSets[0];
}
