import { Chess } from 'chess.js';
import { TacticalTheme, EngineEvaluation } from './types';
import { THEME_RARITY } from './constants';

export function calculateDifficulty(
  fen: string,
  solution: string[],
  themes: TacticalTheme[],
  engineAnalysis: EngineEvaluation[]
): 1 | 2 | 3 | 4 | 5 {
  let totalPoints = 0;

  // Factor 1: First move type (0-2 points)
  totalPoints += scoreFirstMoveType(fen, solution[0]);

  // Factor 2: Solution length (0-2 points)
  totalPoints += scoreSolutionLength(solution.length);

  // Factor 3: Piece count (0-2 points)
  totalPoints += scorePieceCount(fen);

  // Factor 4: Forcing nature (0-2 points)
  totalPoints += scoreForcingNature(fen, solution);

  // Factor 5: Theme rarity (0-2 points)
  totalPoints += scoreThemeRarity(themes);

  // Factor 6: Counterplay (0-2 points)
  totalPoints += scoreCounterplay(engineAnalysis);

  // Map total points to difficulty
  if (totalPoints <= 2) return 1;
  if (totalPoints <= 4) return 2;
  if (totalPoints <= 6) return 3;
  if (totalPoints <= 9) return 4;
  return 5;
}

function scoreFirstMoveType(fen: string, firstMove: string): number {
  const chess = new Chess(fen);

  const from = firstMove.substring(0, 2);
  const to = firstMove.substring(2, 4);
  const promotion = firstMove.length > 4 ? firstMove[4] : undefined;

  const move = chess.move({ from, to, promotion });
  if (!move) return 0;

  // Check if gives check
  const afterMove = new Chess(chess.fen());
  if (afterMove.isCheck()) return 0;

  // Check if is capture
  if (move.captured) return 1;

  // Quiet move
  return 2;
}

function scoreSolutionLength(length: number): number {
  if (length <= 1) return 0;
  if (length <= 3) return 1;
  return 2;
}

function scorePieceCount(fen: string): number {
  const chess = new Chess(fen);
  const board = chess.board();

  let count = 0;
  for (const row of board) {
    for (const square of row) {
      if (square) count++;
    }
  }

  if (count <= 10) return 0;
  if (count <= 20) return 1;
  return 2;
}

function scoreForcingNature(fen: string, solution: string[]): number {
  const chess = new Chess(fen);
  let checks = 0;
  let totalMoves = 0;

  for (const moveUci of solution) {
    const from = moveUci.substring(0, 2);
    const to = moveUci.substring(2, 4);
    const promotion = moveUci.length > 4 ? moveUci[4] : undefined;

    const move = chess.move({ from, to, promotion });
    if (!move) break;

    totalMoves++;
    const afterChess = new Chess(chess.fen());
    if (afterChess.isCheck()) checks++;
  }

  if (totalMoves === 0) return 0;

  const checkRatio = checks / totalMoves;
  if (checkRatio === 1) return 0; // All checks
  if (checkRatio > 0.5) return 1; // Mixed
  return 2; // Mostly quiet
}

function scoreThemeRarity(themes: TacticalTheme[]): number {
  if (themes.length === 0) return 0;

  const rarityScores = themes.map((theme) => THEME_RARITY[theme.id] || 0);
  const maxRarity = Math.max(...rarityScores);

  return maxRarity;
}

function scoreCounterplay(engineAnalysis: EngineEvaluation[]): number {
  // Simple heuristic: if there are multiple good moves, position has counterplay
  if (engineAnalysis.length < 2) return 0;

  const bestEval = engineAnalysis[0].eval;
  const secondEval = engineAnalysis[1].eval;

  const gap = Math.abs(bestEval - secondEval);

  if (gap > 300) return 0; // No counterplay
  if (gap > 150) return 1; // Mild counterplay
  return 2; // Serious counterplay
}
