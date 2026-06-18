import { useKnightTheme, type KnightTheme } from '@/constants/knight-theme';
import { usePlayerProfile, type GameResult } from '@/constants/player-profile';
import { Chess, type Move, type Square } from 'chess.js';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getCoachAdvice, getOpeningInsights } from '@/lib/gemini';
import {
    Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions,
    Animated,
} from 'react-native';
import { playMoveSound, playCaptureSound, playCheckSound, playGameOverSound } from '@/lib/sound';
import { getPieceSet, pieceSets } from '@/lib/piece-sets';
import { findOpening } from '@/lib/opening-book';
import * as Clipboard from 'expo-clipboard';
import { Confetti } from '@/components/confetti';
import { ChessPiece } from '@/components/chess-piece';

type Side = 'w' | 'b';
type GameMode = 'local' | 'ai';
type LastMove = { from: Square; to: Square } | null;
type ResignedSide = Side | null;
type PromotionPiece = 'q' | 'r' | 'b' | 'n';
type PendingPromotion = { from: Square; to: Square } | null;
type Premove = { from: Square; to: Square; promotion: PromotionPiece } | null;
type TimeOption = 60 | 180 | 300 | 600;
type AiDifficulty = 'easy' | 'normal' | 'hard' | 'pro';
type GameSnapshot = {
    fen: string; lastMove: LastMove; whiteTime: number; blackTime: number;
    history: Move[]; capturedWhite: string[]; capturedBlack: string[]; resignedSide: ResignedSide;
};

const timeOptions: TimeOption[] = [60, 180, 300, 600];
const aiDifficulties: AiDifficulty[] = ['easy', 'normal', 'hard', 'pro'];

const pieceSymbols: Record<string, string> = {
    wp: '\u2659', wn: '\u2658', wb: '\u2657', wr: '\u2656', wq: '\u2655', wk: '\u2654',
    bp: '\u265F', bn: '\u265E', bb: '\u265D', br: '\u265C', bq: '\u265B', bk: '\u265A',
};

const pieceValues: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
const promotionPieces: PromotionPiece[] = ['q', 'r', 'b', 'n'];

function formatTime(seconds: number) {
    const safeSeconds = Math.max(0, seconds);
    const m = Math.floor(safeSeconds / 60);
    const s = safeSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function squareName(row: number, col: number) { return `${'abcdefgh'[col]}${8 - row}` as Square; }

function squareCoords(square: Square) {
    return { row: 8 - Number(square[1]), col: square.charCodeAt(0) - 97 };
}

function isInsideBoard(row: number, col: number) { return row >= 0 && row < 8 && col >= 0 && col < 8; }

function getPremoveTargets(game: Chess, from: Square) {
    const piece = game.get(from);
    if (!piece || piece.color !== 'w') return [];
    const targets: Square[] = [];
    const { row, col } = squareCoords(from);
    const addTarget = (nr: number, nc: number) => {
        if (!isInsideBoard(nr, nc)) return false;
        const t = squareName(nr, nc);
        const tp = game.get(t);
        if (tp?.color === 'w') return false;
        targets.push(t); return !tp;
    };
    const addLine = (rr: number, cc: number) => { let nr = row + rr, nc = col + cc; while (addTarget(nr, nc)) { nr += rr; nc += cc; } };
    if (piece.type === 'p') {
        const o = row - 1;
        const os = isInsideBoard(o, col) ? squareName(o, col) : null;
        if (os && !game.get(os)) {
            targets.push(os);
            if (row === 6) { const ts = squareName(row - 2, col); if (!game.get(ts)) targets.push(ts); }
        }
        [-1, 1].forEach((cs) => {
            const cr = row - 1, cc = col + cs;
            if (!isInsideBoard(cr, cc)) return;
            const t = squareName(cr, cc);
            if (game.get(t)?.color === 'b' || game.fen().split(' ')[3] === t) targets.push(t);
        });
    }
    if (piece.type === 'n') { [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([rr,cc])=>addTarget(row+rr,col+cc)); }
    if (piece.type === 'b' || piece.type === 'q') { addLine(-1,-1);addLine(-1,1);addLine(1,-1);addLine(1,1); }
    if (piece.type === 'r' || piece.type === 'q') { addLine(-1,0);addLine(1,0);addLine(0,-1);addLine(0,1); }
    if (piece.type === 'k') {
        [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([rr,cc])=>addTarget(row+rr,col+cc));
        if (from === 'e1') {
            const c = game.fen().split(' ')[2];
            if (c.includes('K') && !game.get('f1') && !game.get('g1')) targets.push('g1');
            if (c.includes('Q') && !game.get('d1') && !game.get('c1') && !game.get('b1')) targets.push('c1');
        }
    }
    return [...new Set(targets)];
}

function getGameStatus(game: Chess, wt: number, bt: number, mode: GameMode, rs: ResignedSide = null) {
    if (rs === 'w') return 'White resigned. Black wins.';
    if (rs === 'b') return 'Black resigned. White wins.';
    if (wt <= 0) return 'White ran out of time. Black wins.';
    if (bt <= 0) return 'Black ran out of time. White wins.';
    if (game.isCheckmate()) return game.turn() === 'w' ? 'Checkmate. Black wins.' : 'Checkmate. White wins.';
    if (game.isDraw()) return 'Draw.';
    if (game.isCheck()) return game.turn() === 'w' ? 'White is in check.' : 'Black is in check.';
    if (mode === 'ai' && game.turn() === 'b') return 'AI is thinking...';
    return game.turn() === 'w' ? 'White to move.' : 'Black to move.';
}

function getPlayerResult(game: Chess, wt: number, bt: number, rs: ResignedSide): GameResult | null {
    if (rs === 'b' || bt <= 0) return 'win';
    if (rs === 'w' || wt <= 0) return 'loss';
    if (game.isCheckmate()) return game.turn() === 'b' ? 'win' : 'loss';
    if (game.isDraw()) return 'draw';
    return null;
}

function getResultTitle(game: Chess, wt: number, bt: number, rs: ResignedSide) {
    if (rs === 'w' || wt <= 0) return 'Black Wins';
    if (rs === 'b' || bt <= 0) return 'White Wins';
    if (game.isCheckmate()) return game.turn() === 'w' ? 'Black Wins' : 'White Wins';
    if (game.isDraw()) return 'Draw';
    return 'Game Over';
}

function evaluatePosition(game: Chess) {
    return game.board().flat().reduce((s, p) => {
        if (!p) return s;
        const v = pieceValues[p.type] ?? 0;
        return p.color === 'b' ? s + v : s - v;
    }, 0);
}

function scoreAiMove(fen: string, move: Move, depth: number = 3): number {
    const tg = new Chess(fen);
    const pm = tg.move(move);
    if (tg.isCheckmate()) return 100000;
    if (tg.isDraw()) return -20;
    let score = evaluatePosition(tg) * 12;
    if (pm.captured) score += (pieceValues[pm.captured] ?? 0) * 14 - (pieceValues[pm.piece] ?? 0);
    if (pm.san.includes('+')) score += 8;
    if (pm.san.includes('=')) score += 18;
    if (['d4','d5','e4','e5'].includes(pm.to)) score += 3;

    if (depth > 1) {
        const replies = tg.moves({ verbose: true });
        if (replies.length > 0) {
            let bestReply = Infinity;
            for (const reply of replies) {
                const replyScore = scoreAiMove(tg.fen(), reply, depth - 1);
                bestReply = Math.min(bestReply, replyScore);
            }
            score = score * 0.6 + bestReply * 0.4;
        }
    }
    return score + Math.random() * 0.3;
}

function chooseAiMove(game: Chess, difficulty: AiDifficulty) {
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return null;
    if (difficulty === 'easy') return moves[Math.floor(Math.random() * moves.length)];
    const ranked = moves.map(m => ({ move: m, score: scoreAiMove(game.fen(), m) })).sort((a, b) => b.score - a.score);
    if (difficulty === 'normal') { const top = ranked.slice(0, Math.min(4, ranked.length)); return top[Math.floor(Math.random() * top.length)].move; }
    if (difficulty === 'hard') { const top = ranked.slice(0, Math.min(2, ranked.length)); return top[Math.floor(Math.random() * top.length)].move; }
    return ranked[0].move;
}

function getOpeningName(history: Move[]) {
    const wm = history.filter(m => m.color === 'w').map(m => m.san.replace(/[+#]/g, ''));
    const fw = wm[0] ?? '';
    const fb = history.find(m => m.color === 'b')?.san.replace(/[+#]/g, '') ?? '';
    if (fw === 'e4' && fb === 'c5') return 'Sicilian Defense';
    if (fw === 'e4' && fb === 'e5') return 'Open Game';
    if (fw === 'd4' && fb === 'd5') return 'Queen Pawn Game';
    if (fw === 'd4' && fb === 'Nf6') return 'Indian Defense';
    if (fw === 'Nf3') return 'Reti Opening';
    if (fw === 'c4') return 'English Opening';
    if (fw === 'e4') return 'King Pawn Opening';
    if (fw === 'd4') return 'Queen Pawn Opening';
    return history.length > 0 ? 'Custom Opening' : 'Not started';
}

function describeMove(move: Move) {
    if (move.flags.includes('k') || move.flags.includes('q')) return `${move.san} - castling`;
    if (move.flags.includes('e')) return `${move.san} - en passant`;
    if (move.flags.includes('p')) return `${move.san} - promotion`;
    return move.san;
}

function needsPromotion(game: Chess, from: Square, to: Square) {
    return game.moves({ square: from, verbose: true }).some(m => m.to === to && m.flags.includes('p'));
}

export default function PlayAiScreen() {
    const { theme } = useKnightTheme();
    const { recordGameResult } = usePlayerProfile();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const { width } = useWindowDimensions();
    const boardSize = Math.min(width - 32, 360);
    const squareSize = boardSize / 8;
    const [fen, setFen] = useState(new Chess().fen());
    const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
    const [legalTargets, setLegalTargets] = useState<Square[]>([]);
    const [lastMove, setLastMove] = useState<LastMove>(null);
    const [whiteTime, setWhiteTime] = useState(600);
    const [blackTime, setBlackTime] = useState(600);
    const [history, setHistory] = useState<Move[]>([]);
    const [capturedWhite, setCapturedWhite] = useState<string[]>([]);
    const [capturedBlack, setCapturedBlack] = useState<string[]>([]);
    const [snapshots, setSnapshots] = useState<GameSnapshot[]>([]);
    const [statusText, setStatusText] = useState('Choose settings, then press Start Game.');
    const [gameMode, setGameMode] = useState<GameMode>('ai');
    const [aiThinking, setAiThinking] = useState(false);
    const [resignedSide, setResignedSide] = useState<ResignedSide>(null);
    const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion>(null);
    const [premove, setPremove] = useState<Premove>(null);
    const [premoveFrom, setPremoveFrom] = useState<Square | null>(null);
    const [premoveTargets, setPremoveTargets] = useState<Square[]>([]);
    const [selectedTime, setSelectedTime] = useState<TimeOption>(600);
    const [gameStarted, setGameStarted] = useState(false);
    const [gamePaused, setGamePaused] = useState(false);
    const [aiDifficulty, setAiDifficulty] = useState<AiDifficulty>('normal');
    const [boardFlipped, setBoardFlipped] = useState(false);
    const [pieceSetName, setPieceSetName] = useState('Standard');
    const [reviewIndex, setReviewIndex] = useState<number | null>(null);
    const [reviewSnapshots, setReviewSnapshots] = useState<GameSnapshot[]>([]);
    const [bestMove, setBestMove] = useState<string | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const aiThinkingRef = useRef(false);
    const [aiCoachLoading, setAiCoachLoading] = useState(false);
    const [geminiTip, setGeminiTip] = useState<string | null>(null);
    const resultRecordedRef = useRef(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, []);

    const game = useMemo(() => new Chess(fen), [fen]);
    const board = game.board();
    const pieceSet = getPieceSet(pieceSetName);
    const gameIsOver = game.isGameOver() || whiteTime <= 0 || blackTime <= 0 || resignedSide !== null;
    const resultTitle = getResultTitle(game, whiteTime, blackTime, resignedSide);
    const resultText = getGameStatus(game, whiteTime, blackTime, gameMode, resignedSide);
    const openingName = getOpeningName(history);

    useEffect(() => {
        if (!gameStarted || gamePaused) return;
        if (gameIsOver) { setStatusText(resultText); return; }
        const timer = setInterval(() => {
            if (game.turn() === 'w') setWhiteTime(t => Math.max(0, t - 1));
            if (game.turn() === 'b') setBlackTime(t => Math.max(0, t - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [fen, game, gameIsOver, blackTime, whiteTime, gameMode, resultText, gameStarted, gamePaused]);

    useEffect(() => {
        const ag = new Chess(fen);
        if (!gameStarted || gamePaused || gameMode !== 'ai' || gameIsOver || ag.turn() !== 'b' || aiThinkingRef.current) return;
        aiThinkingRef.current = true;
        setAiThinking(true);
        setStatusText('AI is thinking...');
        const timeout = setTimeout(() => {
            const aiGame = new Chess(fen);
            const aiMove = chooseAiMove(aiGame, aiDifficulty);
            if (!aiMove) { aiThinkingRef.current = false; setAiThinking(false); setStatusText(getGameStatus(aiGame, whiteTime, blackTime, gameMode)); return; }
            const move = aiGame.move(aiMove);
            if (move.captured) playCaptureSound();
            if (move.san.includes('+')) playCheckSound();
            let finalGame = aiGame;
            let finalLastMove = { from: move.from, to: move.to };
            let finalStatus = `AI played ${move.san}. White to move.`;
            addCapturedPiece(move);
            setHistory(moves => [...moves, move]);
            if (premove) {
                const pg = new Chess(aiGame.fen());
                try {
                    const pm = pg.move(premove);
                    if (pm) { finalGame = pg; finalLastMove = { from: pm.from, to: pm.to }; finalStatus = `Premove played ${pm.san}. AI is thinking...`; addCapturedPiece(pm); setHistory(moves => [...moves, pm]); }
                } catch { finalStatus = `AI played ${move.san}. Premove cancelled.`; }
                clearPremove();
            }
            setFen(finalGame.fen()); setLastMove(finalLastMove);
            aiThinkingRef.current = false; setAiThinking(false); setStatusText(finalStatus);
        }, 650);
        return () => clearTimeout(timeout);
    }, [aiDifficulty, blackTime, fen, gameIsOver, gameMode, gamePaused, gameStarted, premove, whiteTime]);

    useEffect(() => {
        if (!gameStarted || !gameIsOver || gameMode !== 'ai' || resultRecordedRef.current) return;
        const pr = getPlayerResult(game, whiteTime, blackTime, resignedSide);
        if (!pr) return;
        if (pr === 'win') setShowConfetti(true);
        resultRecordedRef.current = true;
        recordGameResult(pr);
    }, [blackTime, game, gameIsOver, gameMode, gameStarted, recordGameResult, resignedSide, whiteTime]);

    function addCapturedPiece(move: Move) {
        if (!move.captured) return;
        if (move.color === 'w') { setCapturedBlack(p => [...p, move.captured!]); return; }
        setCapturedWhite(p => [...p, move.captured!]);
    }

    function clearPremove() { setPremove(null); setPremoveFrom(null); setPremoveTargets([]); }

    function resetGame(nextMode = gameMode, nextTime = selectedTime) {
        const fg = new Chess();
        setGameMode(nextMode); setSelectedTime(nextTime); setFen(fg.fen());
        setSelectedSquare(null); setLegalTargets([]); setLastMove(null);
        setWhiteTime(nextTime); setBlackTime(nextTime); setHistory([]);
        setCapturedWhite([]); setCapturedBlack([]); setSnapshots([]);
        setStatusText('Choose settings, then press Start Game.'); setResignedSide(null);
        setPendingPromotion(null); setGameStarted(false); setGamePaused(false);
        aiThinkingRef.current = false; setAiThinking(false); resultRecordedRef.current = false;
    }

    function startGame() {
        if (gameIsOver || gameStarted) return;
        setGameStarted(true); setGamePaused(false);
        setStatusText(getGameStatus(game, whiteTime, blackTime, gameMode));
    }

    function togglePause() {
        if (!gameStarted || gameIsOver || aiThinking) return;
        setGamePaused(p => { const n = !p; setStatusText(n ? 'Game paused.' : getGameStatus(game, whiteTime, blackTime, gameMode)); return n; });
    }

    function changeGameMode(nextMode: GameMode) { resetGame(nextMode); }

    function changeTimeControl(nextTime: TimeOption) { resetGame(gameMode, nextTime); }

    function changeAiDifficulty(next: AiDifficulty) {
        setAiDifficulty(next);
        if (!gameStarted || gamePaused) setStatusText(`AI difficulty set to ${next}. Press Start Game.`);
    }

    async function requestGeminiCoach() {
        if (!gameStarted || gamePaused || gameIsOver || aiThinking || aiCoachLoading) return;
        setAiCoachLoading(true);
        setGeminiTip(null);
        const tip = await getCoachAdvice(fen, history.map(m => m.san), aiDifficulty);
        if (tip) {
            setGeminiTip(tip);
        }
        setAiCoachLoading(false);
    }

    function undoMove() {
        const prev = snapshots[snapshots.length - 1];
        if (!prev || aiThinking) return;
        setFen(prev.fen); setLastMove(prev.lastMove); setWhiteTime(prev.whiteTime); setBlackTime(prev.blackTime);
        setHistory(prev.history); setCapturedWhite(prev.capturedWhite); setCapturedBlack(prev.capturedBlack);
        setResignedSide(prev.resignedSide); setPendingPromotion(null); setSelectedSquare(null); setLegalTargets([]);
        setSnapshots(items => items.slice(0, -1));
        setStatusText(getGameStatus(new Chess(prev.fen), prev.whiteTime, prev.blackTime, gameMode, prev.resignedSide));
    }

    function resignGame() {
        if (!gameStarted) { setStatusText('Press Start Game first.'); return; }
        if (gamePaused) { setStatusText('Resume the game first.'); return; }
        if (gameIsOver || aiThinking) return;
        const st = game.turn();
        setSelectedSquare(null); setLegalTargets([]); setPendingPromotion(null); setResignedSide(st);
        setStatusText(st === 'w' ? 'White resigned. Black wins.' : 'Black resigned. White wins.');
    }

    async function copyPGN() {
      const pgn = history.map((m, i) => `${Math.floor(i/2)+1}.${i%2===0?'':'..'}${m.san}`).join(' ');
      await Clipboard.setStringAsync(pgn);
      setStatusText('PGN copied to clipboard!');
    }

    function updateBestMove() {
      if (gameMode !== 'ai' || aiThinking) return;
      const testGame = new Chess(fen);
      const moves = testGame.moves({ verbose: true });
      if (moves.length === 0) return;
    const ranked = moves.map(m => {
        return { san: m.san, score: scoreAiMove(testGame.fen(), m) };
    }).sort((a, b) => b.score - a.score);
      setBestMove(ranked[0]?.san ?? null);
    }

    function enterReview() {
      if (snapshots.length === 0) return;
      setReviewSnapshots(snapshots);
      setReviewIndex(snapshots.length - 1);
    }

    function reviewPrev() {
      if (reviewIndex === null || reviewIndex <= 0) return;
      const idx = reviewIndex - 1;
      setReviewIndex(idx);
      const snap = reviewSnapshots[idx];
      if (snap) { setFen(snap.fen); setLastMove(snap.lastMove); setHistory(snap.history); setCapturedWhite(snap.capturedWhite); setCapturedBlack(snap.capturedBlack); }
    }

    function reviewNext() {
      if (reviewIndex === null || reviewIndex >= reviewSnapshots.length - 1) return;
      const idx = reviewIndex + 1;
      setReviewIndex(idx);
      const snap = reviewSnapshots[idx];
      if (snap) { setFen(snap.fen); setLastMove(snap.lastMove); setHistory(snap.history); setCapturedWhite(snap.capturedWhite); setCapturedBlack(snap.capturedBlack); }
    }

    function exitReview() {
      setReviewIndex(null);
      setReviewSnapshots([]);
      resetGame();
    }

    function selectSquare(square: Square) {
        setSelectedSquare(square);
        setLegalTargets(game.moves({ square, verbose: true }).map(m => m.to));
        setStatusText('Choose where to move.');
    }

    function makePlayerMove(from: Square, to: Square, promotion: PromotionPiece = 'q') {
        playMoveSound();
        const pg = new Chess(fen);
        const snap = { fen, lastMove, whiteTime, blackTime, history: [...history], capturedWhite: [...capturedWhite], capturedBlack: [...capturedBlack], resignedSide };
        let move: Move | null = null;
        try { move = pg.move({ from, to, promotion }); } catch { return; }
        if (!move) return;
        addCapturedPiece(move);
        setSnapshots(s => [...s, snap]);
        setFen(pg.fen()); setHistory(m => [...m, move]); setLastMove({ from: move.from, to: move.to });
        setSelectedSquare(null); setLegalTargets([]); setPendingPromotion(null); clearPremove();
        setStatusText(`${describeMove(move)} played.`);
        setTimeout(() => updateBestMove(), 100);
    }

    function choosePromotion(piece: PromotionPiece) {
        if (!pendingPromotion) return;
        makePlayerMove(pendingPromotion.from, pendingPromotion.to, piece);
    }

    function selectPremoveSquare(square: Square) {
        const sg = new Chess(fen);
        const piece = sg.get(square);
        if (!piece || piece.color !== 'w') return;
        const targets = getPremoveTargets(sg, square);
        if (targets.length === 0) return;
        setPremoveFrom(square); setPremoveTargets(targets); setStatusText('Premove: choose target square.');
    }

    function queuePremove(from: Square, to: Square) {
        setPremove({ from, to, promotion: 'q' }); setPremoveFrom(null); setPremoveTargets([]);
        setSelectedSquare(null); setLegalTargets([]); setStatusText(`Premove set: ${from}-${to}`);
    }

    function handlePremovePress(square: Square) {
        if (!premoveFrom) { selectPremoveSquare(square); return; }
        if (premoveFrom === square) { clearPremove(); setStatusText('AI is thinking...'); return; }
        const piece = game.get(square);
        if (piece?.color === 'w') { selectPremoveSquare(square); return; }
        if (!premoveTargets.includes(square)) return;
        queuePremove(premoveFrom, square);
    }

    function handleSquarePress(square: Square) {
        if (gameIsOver) return;
        if (!gameStarted) { setStatusText('Press Start Game first.'); return; }
        if (gamePaused) { setStatusText('Game is paused.'); return; }
        if (pendingPromotion) return;
        if (gameMode === 'ai' && game.turn() === 'b') { handlePremovePress(square); return; }
        const piece = game.get(square);
        if (!selectedSquare) {
            if (!piece || piece.color !== game.turn()) return;
            selectSquare(square); return;
        }
        if (selectedSquare === square) { setSelectedSquare(null); setLegalTargets([]); setStatusText(getGameStatus(game, whiteTime, blackTime, gameMode)); return; }
        if (piece?.color === game.turn()) { selectSquare(square); return; }
        if (needsPromotion(game, selectedSquare, square)) { setPendingPromotion({ from: selectedSquare, to: square }); setStatusText('Choose promotion piece.'); return; }
        makePlayerMove(selectedSquare, square);
    }

    const boardToRender = boardFlipped ? [...board].reverse().map(r => [...r].reverse()) : board;

    return (
        <ScrollView contentContainerStyle={styles.page}>
            <Animated.View style={[styles.appShell, { opacity: fadeAnim }]}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>\u2654 KnightMind</Text>
                        <Text style={styles.subtitle}>{gameMode === 'local' ? 'Local match' : `${aiDifficulty} AI`}</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <Pressable style={styles.flipButton} onPress={() => setBoardFlipped(f => !f)}>
                            <Text style={styles.flipButtonText}>{'\u21BB'}</Text>
                        </Pressable>
                        <Pressable style={styles.homeButton} onPress={() => router.replace('/')}>
                            <Text style={styles.homeButtonText}>{'\u2190'}</Text>
                        </Pressable>
                    </View>
                </View>

                {!gameStarted && (
                    <View style={styles.glassPanel}>
                        <Text style={styles.panelLabel}>Game Setup</Text>
                        <View style={styles.modeSwitch}>
                            {(['local', 'ai'] as GameMode[]).map(m => (
                                <Pressable key={m} style={[styles.modeButton, gameMode === m && styles.modeButtonActive]} onPress={() => changeGameMode(m)}>
                                    <Text style={[styles.modeButtonText, gameMode === m && styles.modeButtonTextActive]}>{m === 'local' ? 'Local' : 'Vs AI'}</Text>
                                </Pressable>
                            ))}
                        </View>
                        <View style={styles.timeControl}>
                            {timeOptions.map(t => (
                                <Pressable key={t} style={[styles.timeButton, selectedTime === t && styles.timeButtonActive]} onPress={() => changeTimeControl(t)}>
                                    <Text style={[styles.timeButtonText, selectedTime === t && styles.timeButtonTextActive]}>{t / 60}m</Text>
                                </Pressable>
                            ))}
                        </View>
                        {gameMode === 'ai' && (
                            <View style={styles.difficultyControl}>
                                {aiDifficulties.map(d => (
                                    <Pressable key={d} style={[styles.diffButton, aiDifficulty === d && styles.diffButtonActive]} onPress={() => changeAiDifficulty(d)}>
                                        <Text style={[styles.diffButtonText, aiDifficulty === d && styles.diffButtonTextActive]}>{d === 'easy' ? 'Easy' : d === 'normal' ? 'Med' : d === 'hard' ? 'Hard' : 'Pro'}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        )}
                        <Pressable style={[styles.startButton, gameStarted && styles.startButtonDisabled]} onPress={startGame} disabled={gameStarted}>
                            <Text style={styles.startButtonText}>Start Game</Text>
                        </Pressable>
                    </View>
                )}

                {gameStarted && (
                    <>
                        <View style={styles.boardPanel}>
                            <View style={styles.playerRow}>
                                <View style={styles.playerInfo}>
                                    <Text style={styles.playerName}>{gameMode === 'local' ? 'Black Player' : 'AI'}</Text>
                                    <Text style={styles.playerSide}>({formatTime(blackTime)})</Text>
                                </View>
                                <View style={[styles.timerBox, game.turn() === 'b' && styles.activeTimer]}>
                                    <Text style={[styles.timerText, game.turn() === 'b' && styles.activeTimerText]}>{formatTime(blackTime)}</Text>
                                </View>
                            </View>

                            <View style={styles.capturedRow}>
                                {capturedWhite.length > 0 ? capturedWhite.map((p, i) => (
                                    <Text key={i} style={styles.capturedPiece}>{pieceSymbols[`w${p}`]}</Text>
                                )) : <Text style={styles.emptyCapture}>-</Text>}
                            </View>

                            <View style={styles.boardOuterFrame}>
                                <View style={styles.boardFrame}>
                                    <View style={{ width: boardSize, height: boardSize }}>
                                        <View style={[styles.board, { width: boardSize, height: boardSize }]}>
                                            {boardToRender.map((row, rowIndex) =>
                                                row.map((piece, colIndex) => {
                                                    const origRow = boardFlipped ? 7 - rowIndex : rowIndex;
                                                    const origCol = boardFlipped ? 7 - colIndex : colIndex;
                                                    const square = squareName(origRow, origCol);
                                                    const isLight = (origRow + origCol) % 2 === 0;
                                                    const isSelected = selectedSquare === square;
                                                    const isLegalTarget = legalTargets.includes(square);
                                                    const isLM = lastMove?.from === square || lastMove?.to === square;
                                                    const pieceKey = piece ? `${piece.color}${piece.type}` : '';
                                                    const isWhite = piece?.color === 'w';

                                                    return (
                                                        <Pressable
                                                            key={square}
                                                            onPress={() => handleSquarePress(square)}
                                                            style={[styles.square, {
                                                                width: squareSize, height: squareSize,
                                                                backgroundColor: isLM ? theme.boardLastMove : isLight ? theme.boardLight : theme.boardDark,
                                                                borderWidth: isSelected ? 3 : 0, borderColor: theme.selection,
                                                            }]}
                                                        >
                                                            {premoveTargets.includes(square) && <View style={styles.premoveDot} />}
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
                                            {('abcdefgh').split('').map((f, i) => {
                                                const ci = boardFlipped ? 7 - i : i;
                                                return (
                                                    <Text key={f} style={[styles.coordFile, { left: ci * squareSize + squareSize / 2 - 8, top: boardSize - 18, fontSize: squareSize * 0.22 }]}>
                                                        {f}
                                                    </Text>
                                                );
                                            })}
                                        </View>
                                        <View style={styles.coordRows} pointerEvents="none">
                                            {('87654321').split('').map((r, i) => {
                                                const ri = boardFlipped ? 7 - i : i;
                                                return (
                                                    <Text key={r} style={[styles.coordRank, { top: ri * squareSize + squareSize / 2 - 8, left: 2, fontSize: squareSize * 0.22 }]}>
                                                        {r}
                                                    </Text>
                                                );
                                            })}
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.capturedRow}>
                                {capturedBlack.length > 0 ? capturedBlack.map((p, i) => (
                                    <Text key={i} style={styles.capturedPiece}>{pieceSymbols[`b${p}`]}</Text>
                                )) : <Text style={styles.emptyCapture}>-</Text>}
                            </View>

                            <View style={styles.playerRow}>
                                <View style={styles.playerInfo}>
                                    <Text style={styles.playerName}>{gameMode === 'local' ? 'White Player' : 'You'}</Text>
                                    <Text style={styles.playerSide}>({formatTime(whiteTime)})</Text>
                                </View>
                                <View style={[styles.timerBox, game.turn() === 'w' && styles.activeTimer]}>
                                    <Text style={[styles.timerText, game.turn() === 'w' && styles.activeTimerText]}>{formatTime(whiteTime)}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.glassPanel}>
                            <View style={styles.statusRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.statusLabel}>Status</Text>
                                    <Text style={styles.statusText}>{statusText}</Text>
                                </View>
                                <View style={styles.moveCountBox}>
                                    <Text style={styles.moveCountNum}>{history.length}</Text>
                                    <Text style={styles.moveCountLabel}>Moves</Text>
                                </View>
                            </View>
                            <View style={styles.openingBadge}>
                                <Text style={styles.openingText}>{openingName}</Text>
                            </View>
                            {bestMove && !gameIsOver && (
                                <View style={{ backgroundColor: theme.primary + '22', borderRadius: 10, padding: 10, marginTop: 4 }}>
                                    <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '900' }}>Best Move: {bestMove}</Text>
                                </View>
                            )}

                            <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                                {pieceSets.map(ps => (
                                    <Pressable key={ps.name} style={[styles.actionButton, pieceSetName === ps.name && { backgroundColor: theme.primary, borderColor: theme.primary }, { flex: 1, paddingVertical: 8 }]} onPress={() => setPieceSetName(ps.name)}>
                                        <Text style={[{ fontSize: 11, fontWeight: '900', color: theme.text }, pieceSetName === ps.name && { color: theme.primaryText }]}>{ps.name}</Text>
                                    </Pressable>
                                ))}
                            </View>
                            {geminiTip && (
                                <View style={[styles.coachTipBox, { backgroundColor: theme.secondary + '22', borderColor: theme.secondary, borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 4 }]}>
                                    <Text style={{ color: theme.secondary, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>AI Coach</Text>
                                    <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700', marginTop: 4, lineHeight: 18 }}>{geminiTip}</Text>
                                </View>
                            )}

                            <View style={styles.actionRow}>
                                <Pressable style={[styles.actionButton, { backgroundColor: theme.primary }]} onPress={() => requestGeminiCoach()}>
                                    <Text style={[styles.actionButtonText, { color: theme.primaryText }]}>Coach</Text>
                                </Pressable>
                                <Pressable style={styles.actionButton} onPress={undoMove}>
                                    <Text style={styles.actionButtonText}>Undo</Text>
                                </Pressable>
                                <Pressable style={[styles.actionButton, gamePaused && styles.primaryButton]} onPress={togglePause}>
                                    <Text style={[styles.actionButtonText, gamePaused && styles.primaryButtonText]}>{gamePaused ? 'Resume' : 'Pause'}</Text>
                                </Pressable>
                                <Pressable style={[styles.actionButton, styles.dangerButton]} onPress={resignGame}>
                                    <Text style={styles.actionButtonText}>Resign</Text>
                                </Pressable>
                                <Pressable style={styles.actionButton} onPress={() => resetGame()}>
                                    <Text style={styles.actionButtonText}>New</Text>
                                </Pressable>
                                <Pressable style={styles.actionButton} onPress={copyPGN}>
                                    <Text style={styles.actionButtonText}>Copy PGN</Text>
                                </Pressable>
                                <Pressable style={styles.actionButton} onPress={enterReview}>
                                    <Text style={styles.actionButtonText}>Review</Text>
                                </Pressable>
                            </View>

                            {history.length > 0 && (
                                <View style={styles.moveList}>
                                    <Text style={styles.moveListTitle}>Moves</Text>
                                    <Text style={styles.moveListText}>
                                        {history.map((m, i) => i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ${m.san}` : ` ${m.san}`).join(' ')}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {reviewIndex !== null && (
                            <View style={[styles.glassPanel, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 }]}>
                                <Pressable style={[styles.actionButton, { flex: 1 }]} onPress={reviewPrev}><Text style={styles.actionButtonText}>Prev</Text></Pressable>
                                <Text style={{ color: theme.primary, fontSize: 16, fontWeight: '900' }}>{reviewIndex + 1} / {reviewSnapshots.length}</Text>
                                <Pressable style={[styles.actionButton, { flex: 1 }]} onPress={reviewNext}><Text style={styles.actionButtonText}>Next</Text></Pressable>
                                <Pressable style={[styles.actionButton, { backgroundColor: theme.danger, borderColor: theme.danger, flex: 1 }]} onPress={exitReview}><Text style={styles.actionButtonText}>Exit</Text></Pressable>
                            </View>
                        )}
                    </>
                )}
            </Animated.View>

            <Confetti active={showConfetti} />

            <Modal visible={gameIsOver} transparent animationType="fade">
                <View style={styles.modalBackdrop}>
                    <View style={styles.resultCard}>
                        <Text style={styles.resultEmoji}>{resultTitle.includes('Wins') ? '\u2655' : '\u265F'}</Text>
                        <Text style={styles.resultTitle}>{resultTitle}</Text>
                        <Text style={styles.resultText}>{resultText}</Text>
                        <Text style={styles.resultMeta}>{history.length} moves played</Text>
                        <Pressable style={styles.resultButton} onPress={() => resetGame()}>
                            <Text style={styles.resultButtonText}>New Game</Text>
                        </Pressable>
                        {snapshots.length > 0 && (
                            <Pressable style={[styles.resultButton, { backgroundColor: theme.secondary, marginTop: 8 }]} onPress={enterReview}>
                                <Text style={[styles.resultButtonText, { color: theme.secondaryText }]}>Review Game</Text>
                            </Pressable>
                        )}
                    </View>
                </View>
            </Modal>

            <Modal visible={pendingPromotion !== null} transparent animationType="fade">
                <View style={styles.modalBackdrop}>
                    <View style={styles.promotionCard}>
                        <Text style={styles.promotionTitle}>Promotion</Text>
                        <Text style={styles.promotionText}>Choose piece:</Text>
                        <View style={styles.promotionGrid}>
                            {promotionPieces.map(p => (
                                <Pressable key={p} style={styles.promotionButton} onPress={() => choosePromotion(p)}>
                                    <Text style={styles.promotionPiece}>{pieceSymbols[`w${p}`]}</Text>
                                    <Text style={styles.promotionLabel}>{p === 'q' ? 'Queen' : p === 'r' ? 'Rook' : p === 'b' ? 'Bishop' : 'Knight'}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

function createStyles(theme: KnightTheme) {
    return StyleSheet.create({
        page: { flexGrow: 1, backgroundColor: theme.page, alignItems: 'center', paddingHorizontal: 14, paddingTop: 18, paddingBottom: 28 },
        appShell: { width: '100%', maxWidth: 430, gap: 14 },
        header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
        title: { color: theme.text, fontSize: 24, fontWeight: '900' },
        subtitle: { color: theme.muted, fontSize: 13, fontWeight: '700', marginTop: 2, textTransform: 'capitalize' },
        headerRight: { flexDirection: 'row', gap: 8 },
        flipButton: { backgroundColor: theme.panel, borderWidth: 1, borderColor: theme.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 },
        flipButtonText: { color: theme.text, fontSize: 18, fontWeight: '900' },
        homeButton: { backgroundColor: theme.panel, borderWidth: 1, borderColor: theme.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
        homeButtonText: { color: theme.text, fontSize: 18, fontWeight: '900' },
        glassPanel: { backgroundColor: theme.glassBg, borderWidth: 1, borderColor: theme.glassBorder, borderRadius: 18, padding: 16, gap: 12 },
        panelLabel: { color: theme.primary, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
        modeSwitch: { backgroundColor: theme.page, borderRadius: 12, flexDirection: 'row', gap: 8, padding: 4 },
        modeButton: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
        modeButtonActive: { backgroundColor: theme.primary },
        modeButtonText: { color: theme.muted, fontSize: 14, fontWeight: '900' },
        modeButtonTextActive: { color: theme.primaryText },
        timeControl: { flexDirection: 'row', gap: 8 },
        timeButton: { flex: 1, backgroundColor: theme.page, borderWidth: 1, borderColor: theme.border, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
        timeButtonActive: { backgroundColor: theme.secondary, borderColor: theme.secondary },
        timeButtonText: { color: theme.text, fontSize: 13, fontWeight: '900' },
        timeButtonTextActive: { color: theme.secondaryText },
        difficultyControl: { flexDirection: 'row', gap: 8 },
        diffButton: { flex: 1, backgroundColor: theme.page, borderWidth: 1, borderColor: theme.border, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
        diffButtonActive: { backgroundColor: theme.surface, borderColor: theme.surface },
        diffButtonText: { color: theme.text, fontSize: 13, fontWeight: '900' },
        diffButtonTextActive: { color: theme.surfaceText },
        startButton: { backgroundColor: theme.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', shadowColor: theme.primary, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
        startButtonDisabled: { opacity: 0.6 },
        startButtonText: { color: theme.primaryText, fontSize: 17, fontWeight: '900' },
        boardPanel: { backgroundColor: theme.glassBg, borderWidth: 1, borderColor: theme.glassBorder, borderRadius: 20, padding: 14, gap: 8 },
        playerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
        playerInfo: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
        playerName: { fontSize: 15, fontWeight: '900', color: theme.text },
        playerSide: { fontSize: 12, fontWeight: '700', color: theme.muted },
        timerBox: { backgroundColor: theme.page, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, minWidth: 70, alignItems: 'center', borderWidth: 1, borderColor: theme.border },
        activeTimer: { backgroundColor: theme.primary, borderColor: theme.primary },
        timerText: { fontSize: 18, fontWeight: '900', color: theme.text, fontVariant: ['tabular-nums'] },
        activeTimerText: { color: theme.primaryText },
        capturedRow: { minHeight: 24, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, gap: 2 },
        capturedPiece: { fontSize: 16, color: theme.text },
        emptyCapture: { color: theme.muted, fontSize: 12 },
        boardOuterFrame: { alignSelf: 'center', borderWidth: 6, borderColor: theme.boardFrame, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 12, backgroundColor: theme.boardFrame },
        boardFrame: { borderWidth: 1, borderColor: 'rgba(0,0,0,0.15)', borderRadius: 6, overflow: 'hidden', backgroundColor: 'transparent' },
        board: { flexDirection: 'row', flexWrap: 'wrap' },
        square: { alignItems: 'center', justifyContent: 'center' },
        legalDot: { position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: theme.legalDot, opacity: 0.38 },
        premoveDot: { position: 'absolute', width: 16, height: 16, borderRadius: 8, backgroundColor: theme.premove, borderWidth: 2, borderColor: theme.selection, opacity: 0.8 },
        coordCols: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
        coordRows: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
        coordFile: { position: 'absolute', color: theme.muted, fontWeight: '700', opacity: 0.6 },
        coordRank: { position: 'absolute', color: theme.muted, fontWeight: '700', opacity: 0.6 },
        statusRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
        statusLabel: { color: theme.primary, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
        statusText: { color: theme.text, fontSize: 14, fontWeight: '700', marginTop: 2, lineHeight: 20 },
        moveCountBox: { backgroundColor: theme.panelAlt, borderRadius: 12, padding: 10, alignItems: 'center', minWidth: 60 },
        moveCountNum: { color: theme.primary, fontSize: 22, fontWeight: '900' },
        moveCountLabel: { color: theme.muted, fontSize: 10, fontWeight: '800', marginTop: 1 },
        openingBadge: { backgroundColor: theme.panelAlt, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' },
        openingText: { color: theme.muted, fontSize: 12, fontWeight: '700' },
        coachTipBox: {},
        actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
        actionButton: { flexGrow: 1, flexBasis: '47%', backgroundColor: theme.panelAlt, borderRadius: 12, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: theme.border },
        actionButtonText: { color: theme.text, fontSize: 14, fontWeight: '900' },
        primaryButton: { backgroundColor: theme.primary, borderColor: theme.primary },
        primaryButtonText: { color: theme.primaryText },
        dangerButton: { backgroundColor: theme.danger, borderColor: theme.danger },
        moveList: { backgroundColor: theme.page, borderRadius: 12, padding: 12, marginTop: 4, borderWidth: 1, borderColor: theme.border },
        moveListTitle: { color: theme.text, fontSize: 13, fontWeight: '900', marginBottom: 6 },
        moveListText: { color: theme.muted, fontSize: 13, lineHeight: 20, fontWeight: '700' },
        modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 },
        resultCard: { width: '100%', maxWidth: 340, backgroundColor: theme.surface, borderRadius: 24, padding: 28, alignItems: 'center', gap: 8 },
        resultEmoji: { fontSize: 56, color: theme.primary, marginBottom: 4 },
        resultTitle: { color: theme.surfaceText, fontSize: 28, fontWeight: '900', textAlign: 'center' },
        resultText: { color: theme.panelAlt, fontSize: 16, fontWeight: '800', textAlign: 'center' },
        resultMeta: { color: theme.muted, fontSize: 13, textAlign: 'center', marginBottom: 8 },
        resultButton: { width: '100%', backgroundColor: theme.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
        resultButtonText: { color: theme.primaryText, fontSize: 16, fontWeight: '900' },
        promotionCard: { width: '100%', maxWidth: 340, backgroundColor: theme.surface, borderRadius: 24, padding: 24, alignItems: 'center', gap: 12 },
        promotionTitle: { color: theme.surfaceText, fontSize: 22, fontWeight: '900' },
        promotionText: { color: theme.muted, fontSize: 14, fontWeight: '700' },
        promotionGrid: { flexDirection: 'row', gap: 10 },
        promotionButton: { flex: 1, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: theme.border },
        promotionPiece: { color: theme.surfaceText, fontSize: 34, fontWeight: '900', marginBottom: 4 },
        promotionLabel: { color: theme.panelAlt, fontSize: 11, fontWeight: '900' },
    });
}
