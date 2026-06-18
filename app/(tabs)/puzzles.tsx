import { useKnightTheme, type KnightTheme } from '@/constants/knight-theme';
import { usePlayerProfile } from '@/constants/player-profile';
import { Chess, type Square } from 'chess.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, Animated } from 'react-native';
import { ChessPiece } from '@/components/chess-piece';

type Puzzle = { id: string; title: string; fen: string; solution: { from: Square; to: Square; promotion?: 'q' }; hint: string };

const puzzles: Puzzle[] = [
  { id: 'p1', title: 'Queen Mate', fen: '7k/6Q1/5K2/8/8/8/8/8 w - - 0 1', solution: { from: 'g7', to: 'f8' }, hint: 'Move the queen next to the king.' },
  { id: 'p2', title: 'Rook Captures', fen: '6k1/8/8/8/3q4/8/8/3R2K1 w - - 0 1', solution: { from: 'd1', to: 'd4' }, hint: 'The rook can capture the queen.' },
  { id: 'p3', title: 'Pawn Promotion', fen: 'k7/6P1/8/8/8/8/8/7K w - - 0 1', solution: { from: 'g7', to: 'g8', promotion: 'q' }, hint: 'Push the pawn to the last rank.' },
  { id: 'p4', title: 'Rook Mate', fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', solution: { from: 'a1', to: 'a8' }, hint: 'Deliver mate on the back rank.' },
  { id: 'p5', title: 'Defend f2', fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', solution: { from: 'd1', to: 'e2' }, hint: 'Defend the f2 pawn.' },
  { id: 'p6', title: 'Knight Fork', fen: 'r1bqkb1r/pppp1ppp/2n5/4N3/2B1n3/8/PPPP1PPP/RNBQK2R w KQkq - 0 5', solution: { from: 'e5', to: 'f7' }, hint: 'Attack king and queen.' },
  { id: 'p7', title: 'Bishop Pair', fen: 'r3k2r/pppq1ppp/2n1bn2/2B1p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 w kq - 0 8', solution: { from: 'c5', to: 'd6' }, hint: 'Penetrate the pawn chain.' },
  { id: 'p8', title: 'Pin to Win', fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 5', solution: { from: 'c4', to: 'f7' }, hint: 'Pin the knight to the king.' },
  { id: 'p9', title: 'Discovered Check', fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/3NP3/8/PPP2PPP/RNBQKB1R w KQkq - 0 4', solution: { from: 'd4', to: 'e6' }, hint: 'Move the pawn to reveal check.' },
  { id: 'p10', title: 'Queen Sac', fen: 'r1b2rk1/pppp1ppp/2n2n2/2b1Pq2/2B5/3P1N2/PPP2PPP/RNBQ1RK1 w - - 0 8', solution: { from: 'e5', to: 'f6' }, hint: 'Capture the queen with the pawn.' },
  { id: 'p11', title: 'Clear Path', fen: 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B5/8/PPPP1PPP/RNB1K2R w KQkq - 0 5', solution: { from: 'f7', to: 'f8' }, hint: 'The queen breaks through.' },
  { id: 'p12', title: 'Rook Lift', fen: 'r1b2rk1/pppp1ppp/2n2q2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 0 8', solution: { from: 'f1', to: 'e1' }, hint: 'Bring the rook to the center.' },
  { id: 'p13', title: 'Pawn Break', fen: 'r1bqkb1r/pppppppp/2n5/8/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 0 2', solution: { from: 'd4', to: 'd5' }, hint: 'Push the center pawn.' },
  { id: 'p14', title: 'Cut Off', fen: '8/8/8/3R4/8/5k2/8/6K1 w - - 0 1', solution: { from: 'd5', to: 'f5' }, hint: 'Cut off the black king.' },
  { id: 'p15', title: 'King March', fen: '8/8/8/3k4/8/8/4K3/8 w - - 0 1', solution: { from: 'e2', to: 'e3' }, hint: 'Move toward the center.' },
];

const pieceSymbols: Record<string, string> = {
  wp: '\u2659', wn: '\u2658', wb: '\u2657', wr: '\u2656', wq: '\u2655', wk: '\u2654',
  bp: '\u265F', bn: '\u265E', bb: '\u265D', br: '\u265C', bq: '\u265B', bk: '\u265A',
};

function squareName(row: number, col: number) { return `${'abcdefgh'[col]}${8 - row}` as Square; }
function isSolutionMove(puzzle: Puzzle, from: Square, to: Square) { return from === puzzle.solution.from && to === puzzle.solution.to; }

export default function PuzzlesScreen() {
  const { theme } = useKnightTheme();
  const { stats, recordPuzzleSolved, solvedPuzzleIds } = usePlayerProfile();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { width } = useWindowDimensions();
  const boardSize = Math.min(width - 32, 360);
  const squareSize = boardSize / 8;
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [activeFen, setActiveFen] = useState(puzzles[0].fen);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalTargets, setLegalTargets] = useState<Square[]>([]);
  const [message, setMessage] = useState('Tap a white piece to solve.');
  const [showHint, setShowHint] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const puzzle = puzzles[puzzleIndex];
  const game = useMemo(() => new Chess(activeFen), [activeFen]);
  const board = game.board();
  const solved = solvedPuzzleIds.includes(puzzle.id);

  useEffect(() => {
    setActiveFen(puzzle.fen); setSelectedSquare(null); setLegalTargets([]); setShowHint(false);
    setMessage('Tap a white piece to solve.');
  }, [puzzle.fen]);

  function clearSelection() { setSelectedSquare(null); setLegalTargets([]); }

  function selectSquare(square: Square) {
    setSelectedSquare(square);
    setLegalTargets(game.moves({ square, verbose: true }).map(m => m.to));
    setMessage('Now tap one highlighted square.');
  }

  function handleSquarePress(square: Square) {
    if (solved) return;
    const piece = game.get(square);
    if (!selectedSquare) {
      if (!piece || piece.color !== 'w') return;
      selectSquare(square); return;
    }
    if (selectedSquare === square) { clearSelection(); setMessage('Tap a white piece to solve.'); return; }
    if (piece?.color === 'w') { selectSquare(square); return; }
    if (!legalTargets.includes(square)) { setMessage('Not a legal move.'); clearSelection(); return; }
    if (!isSolutionMove(puzzle, selectedSquare, square)) { setMessage('Not the puzzle move. Try again.'); clearSelection(); return; }
    const ng = new Chess(activeFen);
    try {
      const moveOpts: any = { from: selectedSquare, to: square };
      if (puzzle.solution.promotion) moveOpts.promotion = puzzle.solution.promotion;
      const move = ng.move(moveOpts);
      if (!move) { setMessage('Try again.'); clearSelection(); return; }
      setActiveFen(ng.fen()); recordPuzzleSolved(puzzle.id); setMessage(`Solved! ${move.san}`); clearSelection();
    } catch { setMessage('Try again.'); clearSelection(); }
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Animated.View style={[styles.shell, { opacity: fadeAnim }]}>
        <View style={styles.headerGlass}>
          <Text style={styles.title}>Puzzles</Text>
          <Text style={styles.subtitle}>Score {stats.puzzleScore}</Text>
        </View>

        <View style={styles.glassCard}>
          <View style={styles.puzzleTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.puzzleTitle}>{puzzle.title}</Text>
              <Text style={styles.puzzleMeta}>{puzzleIndex + 1} of {puzzles.length}</Text>
            </View>
            <View style={[styles.statusBadge, solved && styles.statusBadgeSolved]}>
              <Text style={[styles.badgeText, solved && { color: theme.primaryText }]}>{solved ? 'Solved' : 'Active'}</Text>
            </View>
          </View>

          <View style={styles.boardOuterFrame}>
            <View style={styles.boardFrame}>
              <View style={{ width: boardSize, height: boardSize }}>
                <View style={[styles.board, { width: boardSize, height: boardSize }]}>
                  {board.map((row, rowIndex) =>
                    row.map((piece, colIndex) => {
                      const square = squareName(rowIndex, colIndex);
                      const isLight = (rowIndex + colIndex) % 2 === 0;
                      const isSelected = selectedSquare === square;
                      const isLegalTarget = legalTargets.includes(square);
                      const pieceKey = piece ? `${piece.color}${piece.type}` : '';
                      const isWhite = piece?.color === 'w';
                      return (
                        <Pressable
                          key={square}
                          onPress={() => handleSquarePress(square)}
                          style={[styles.square, {
                            width: squareSize, height: squareSize,
                            backgroundColor: isSelected ? theme.boardLastMove : isLight ? theme.boardLight : theme.boardDark,
                            borderWidth: isSelected ? 3 : 0, borderColor: theme.selection,
                          }]}
                        >
                          {isLegalTarget && <View style={styles.legalDot} />}
                          {piece && (
                            <ChessPiece pieceKey={pieceKey} isWhite={isWhite} size={squareSize} theme={theme} />
                          )}
                        </Pressable>
                      );
                    })
                  )}
                </View>
                <View style={styles.coordCols} pointerEvents="none">
                  {('abcdefgh').split('').map((f, i) => (
                    <Text key={f} style={[styles.coordFile, { left: i * squareSize + squareSize / 2 - 8, top: boardSize - 18, fontSize: squareSize * 0.22 }]}>{f}</Text>
                  ))}
                </View>
                <View style={styles.coordRows} pointerEvents="none">
                  {('87654321').split('').map((r, i) => (
                    <Text key={r} style={[styles.coordRank, { top: i * squareSize + squareSize / 2 - 8, left: 2, fontSize: squareSize * 0.22 }]}>{r}</Text>
                  ))}
                </View>
              </View>
            </View>
          </View>

          <View style={styles.messageBox}>
            <Text style={styles.messageText}>{message}</Text>
            {showHint && <Text style={styles.hintText}>{puzzle.hint}</Text>}
          </View>

          <View style={styles.actions}>
            <Pressable style={[styles.actionButton, { backgroundColor: theme.panelAlt }]} onPress={() => setShowHint(true)}>
              <Text style={[styles.actionButtonText, { color: theme.text }]}>Hint</Text>
            </Pressable>
            <Pressable style={[styles.actionButton, { backgroundColor: theme.panelAlt }]} onPress={() => { setActiveFen(puzzle.fen); clearSelection(); setShowHint(false); setMessage('Tap a white piece to solve.'); }}>
              <Text style={[styles.actionButtonText, { color: theme.text }]}>Reset</Text>
            </Pressable>
            <Pressable style={[styles.actionButton, { backgroundColor: theme.primary }]} onPress={() => setPuzzleIndex(i => (i + 1) % puzzles.length)}>
              <Text style={[styles.actionButtonText, { color: theme.primaryText }]}>Next</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

function createStyles(theme: KnightTheme) {
  return StyleSheet.create({
    page: { flexGrow: 1, backgroundColor: theme.page, alignItems: 'center', padding: 16, paddingBottom: 34 },
    shell: { width: '100%', maxWidth: 430, gap: 14 },
    headerGlass: { backgroundColor: theme.glassBg, borderWidth: 1, borderColor: theme.glassBorder, borderRadius: 18, padding: 18, paddingTop: 28 },
    title: { color: theme.text, fontSize: 28, fontWeight: '900' },
    subtitle: { color: theme.muted, fontSize: 14, fontWeight: '800', marginTop: 4 },
    glassCard: { backgroundColor: theme.glassBg, borderWidth: 1, borderColor: theme.glassBorder, borderRadius: 20, padding: 16, gap: 14 },
    puzzleTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    puzzleTitle: { color: theme.text, fontSize: 20, fontWeight: '900' },
    puzzleMeta: { color: theme.muted, fontSize: 13, fontWeight: '700', marginTop: 2 },
    statusBadge: { backgroundColor: theme.secondary, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, overflow: 'hidden' },
    statusBadgeSolved: { backgroundColor: theme.primary },
    badgeText: { color: theme.secondaryText, fontSize: 12, fontWeight: '900' },
    boardOuterFrame: { alignSelf: 'center', borderWidth: 6, borderColor: theme.boardFrame, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 12, backgroundColor: theme.boardFrame },
    boardFrame: { borderWidth: 1, borderColor: 'rgba(0,0,0,0.15)', borderRadius: 6, overflow: 'hidden', backgroundColor: 'transparent' },
    board: { flexDirection: 'row', flexWrap: 'wrap' },
    square: { alignItems: 'center', justifyContent: 'center' },
    legalDot: { position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: theme.legalDot, opacity: 0.38 },
    coordCols: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    coordRows: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    coordFile: { position: 'absolute', color: theme.muted, fontWeight: '700', opacity: 0.6 },
    coordRank: { position: 'absolute', color: theme.muted, fontWeight: '700', opacity: 0.6 },
    messageBox: { backgroundColor: theme.panelAlt, borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 14 },
    messageText: { color: theme.text, fontSize: 15, fontWeight: '900' },
    hintText: { color: theme.primary, fontSize: 14, fontWeight: '800', marginTop: 6 },
    actions: { flexDirection: 'row', gap: 8 },
    actionButton: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
    actionButtonText: { fontSize: 14, fontWeight: '900' },
  });
}
