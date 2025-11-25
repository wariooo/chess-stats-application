import { Chess } from 'chess.js';
import { StockfishEngine } from './stockfish-engine';
import {
  PuzzleCandidate,
  PositionAnalysis,
  PuzzleGenerationSettings,
  ChessGameData,
} from './types';

export async function analyzeGameForPuzzles(
  game: ChessGameData,
  engine: StockfishEngine,
  settings: PuzzleGenerationSettings,
  onProgress?: (current: number, total: number) => void
): Promise<PuzzleCandidate[]> {
  const chess = new Chess();
  chess.loadPgn(game.pgn);

  const history = chess.history({ verbose: true });
  const candidates: PuzzleCandidate[] = [];

  // Reset to start
  chess.reset();

  for (let i = 0; i < history.length; i++) {
    const moveNumber = Math.floor(i / 2) + 1;

    // Skip opening moves
    if (moveNumber < settings.minMoveNumber) {
      chess.move(history[i]);
      continue;
    }

    const fen = chess.fen();
    const playerMove = history[i];

    // Analyze position
    try {
      const analysis = await engine.analyze(
        fen,
        settings.engineDepth,
        settings.multiPvCount
      );

      if (analysis.length < 2) {
        chess.move(history[i]);
        continue;
      }

      const bestMove = analysis[0];
      const secondBest = analysis[1];

      // Check if position should be excluded
      const exclusion = shouldExcludePosition(
        fen,
        bestMove.eval,
        moveNumber,
        playerMove.lan,
        settings
      );

      if (exclusion.exclude) {
        chess.move(history[i]);
        if (onProgress) onProgress(i + 1, history.length);
        continue;
      }

      // Check if it's an "only move"
      const evalGap = calculateEvalGap(bestMove, secondBest);
      const isOnlyMove = evalGap >= settings.evalGapThreshold;

      if (isOnlyMove) {
        const playerFoundIt = playerMove.lan === bestMove.move;
        const qualityScore = calculateQualityScore({
          evalGap,
          bestMove,
          isCapture: playerMove.captured !== undefined,
          isCheck: playerMove.san.includes('+'),
        });

        candidates.push({
          fen,
          moveNumber,
          sideToMove: chess.turn() === 'w' ? 'white' : 'black',
          bestMove,
          secondBest,
          evalGap,
          playerMove: playerMove.lan,
          playerFoundIt,
          qualityScore,
        });
      }
    } catch (error) {
      console.error(`Error analyzing move ${i}:`, error);
    }

    chess.move(history[i]);
    if (onProgress) onProgress(i + 1, history.length);
  }

  return candidates.sort((a, b) => b.qualityScore - a.qualityScore);
}

function calculateEvalGap(
  bestMove: { eval: number; mate: number | null },
  secondBest: { eval: number; mate: number | null }
): number {
  // Handle mate scores
  if (bestMove.mate !== null) {
    if (secondBest.mate !== null) {
      return Math.abs(bestMove.mate - secondBest.mate) * 100;
    }
    return 1000; // Mate vs non-mate is huge
  }

  if (secondBest.mate !== null) {
    return 1000;
  }

  return Math.abs(bestMove.eval - secondBest.eval);
}

function shouldExcludePosition(
  fen: string,
  eval: number,
  moveNumber: number,
  move: string,
  settings: PuzzleGenerationSettings
): { exclude: boolean; reason: string } {
  const chess = new Chess(fen);

  // Exclude if position is too winning/losing
  if (Math.abs(eval) > settings.maxEvalForPuzzle) {
    return { exclude: true, reason: 'Position too decisive' };
  }

  // Exclude if checkmate or stalemate
  if (chess.isCheckmate() || chess.isStalemate()) {
    return { exclude: true, reason: 'Game over' };
  }

  // Exclude if only one legal move
  const legalMoves = chess.moves();
  if (legalMoves.length === 1) {
    return { exclude: true, reason: 'Forced move' };
  }

  // Check for simple recapture
  if (isSimpleRecapture(chess, move)) {
    return { exclude: true, reason: 'Simple recapture' };
  }

  return { exclude: false, reason: '' };
}

function isSimpleRecapture(chess: Chess, move: string): boolean {
  // Get the history to see if previous move was a capture on same square
  const history = chess.history({ verbose: true });
  if (history.length === 0) return false;

  const lastMove = history[history.length - 1];
  const currentTo = move.substring(2, 4);

  return lastMove.captured !== undefined && lastMove.to === currentTo;
}

function calculateQualityScore(params: {
  evalGap: number;
  bestMove: any;
  isCapture: boolean;
  isCheck: boolean;
}): number {
  let score = 0;

  // Larger eval gap = better
  score += Math.min(params.evalGap / 50, 50);

  // Quiet moves are better for puzzles
  if (!params.isCapture && !params.isCheck) {
    score += 20;
  }

  // Slightly bonus for tactics
  if (params.isCapture) {
    score += 5;
  }

  return score;
}
