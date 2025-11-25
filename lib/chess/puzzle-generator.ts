import { Chess } from 'chess.js';
import { StockfishEngine } from './stockfish-engine';
import { classifyThemes } from './theme-classifier';
import { calculateDifficulty } from './difficulty-scorer';
import {
  PuzzleData,
  PuzzleCandidate,
  ChessGameData,
  PuzzleExplanation,
} from './types';

export async function buildPuzzleSolution(
  startFen: string,
  engine: StockfishEngine,
  maxMoves: number = 5
): Promise<{ solution: string[]; solutionSan: string[] }> {
  const chess = new Chess(startFen);
  const solution: string[] = [];
  const solutionSan: string[] = [];

  let moveCount = 0;
  let previousEval = 0;

  while (moveCount < maxMoves) {
    const analysis = await engine.analyze(chess.fen(), 18, 1);

    if (analysis.length === 0) break;

    const bestMove = analysis[0];
    const from = bestMove.move.substring(0, 2);
    const to = bestMove.move.substring(2, 4);
    const promotion = bestMove.move.length > 4 ? bestMove.move[4] : undefined;

    const move = chess.move({ from, to, promotion });
    if (!move) break;

    solution.push(bestMove.move);
    solutionSan.push(move.san);

    // Check stopping conditions
    if (chess.isCheckmate()) break;

    const currentEval = bestMove.eval;
    const evalChange = Math.abs(currentEval - previousEval);

    // Stop if eval stabilizes (no more critical moves)
    if (moveCount > 0 && evalChange < 100) break;

    // Stop if material advantage is decisive
    if (Math.abs(currentEval) > 500) break;

    previousEval = currentEval;
    moveCount++;
  }

  // Ensure solution ends on solver's move (odd length)
  if (solution.length % 2 === 0 && solution.length > 0) {
    solution.pop();
    solutionSan.pop();
  }

  return { solution, solutionSan };
}

export async function generatePuzzleFromCandidate(
  candidate: PuzzleCandidate,
  game: ChessGameData,
  engine: StockfishEngine,
  userId: number,
  gameId: number
): Promise<PuzzleData> {
  // Build solution
  const { solution, solutionSan } = await buildPuzzleSolution(
    candidate.fen,
    engine
  );

  // Classify themes
  const themes = classifyThemes(candidate.fen, solution, [
    candidate.bestMove,
    candidate.secondBest,
  ]);

  // Calculate difficulty
  const difficulty = calculateDifficulty(candidate.fen, solution, themes, [
    candidate.bestMove,
    candidate.secondBest,
  ]);

  // Generate explanation
  const explanation = generateExplanation(
    candidate.fen,
    solution,
    solutionSan,
    themes,
    candidate
  );

  const puzzle: PuzzleData = {
    userId,
    gameId,
    fen: candidate.fen,
    sideToMove: candidate.sideToMove,
    solution,
    solutionSan,
    themes,
    difficulty,
    moveNumber: candidate.moveNumber,
    playerFoundIt: candidate.playerFoundIt,
    explanation,
    source: {
      white: game.white,
      black: game.black,
      whiteElo: game.whiteElo || 0,
      blackElo: game.blackElo || 0,
      result: game.result,
      playedAt: game.playedAt.toISOString(),
      url: game.chesscomUrl,
    },
  };

  return puzzle;
}

function generateExplanation(
  fen: string,
  solution: string[],
  solutionSan: string[],
  themes: any[],
  candidate: PuzzleCandidate
): PuzzleExplanation {
  const chess = new Chess(fen);
  const sideToMove = chess.turn() === 'w' ? 'White' : 'Black';

  // Generate context
  let context = `${sideToMove} to move. `;
  if (chess.isCheck()) {
    context += `The king is in check. `;
  }
  if (candidate.evalGap > 300) {
    context += `There is a critical tactical opportunity in this position.`;
  } else {
    context += `A precise move is required to maintain the advantage.`;
  }

  // Generate key idea based on themes
  let keyIdea = '';
  if (themes.length > 0) {
    const mainTheme = themes[0];
    keyIdea = `The key is to execute a ${mainTheme.name.toLowerCase()}. `;
  }
  keyIdea += `The best move is ${solutionSan[0]}.`;

  // Generate continuation
  let continuation = `After ${solutionSan.join(' ')}, `;
  if (chess.isCheckmate()) {
    continuation += `${sideToMove} delivers checkmate.`;
  } else if (candidate.evalGap > 300) {
    continuation += `${sideToMove} wins material and has a winning advantage.`;
  } else {
    continuation += `${sideToMove} maintains a clear advantage.`;
  }

  // Generate alternatives
  const alternatives = `Other moves like ${candidate.secondBest.moveSan} are less accurate and allow the opponent to defend.`;

  return {
    context,
    keyIdea,
    continuation,
    alternatives,
  };
}

export async function generatePuzzlesFromGames(
  games: ChessGameData[],
  engine: StockfishEngine,
  userId: number,
  settings: any,
  onProgress?: (current: number, total: number, puzzlesFound: number) => void
): Promise<PuzzleData[]> {
  const allPuzzles: PuzzleData[] = [];

  for (let i = 0; i < games.length; i++) {
    const game = games[i];

    try {
      // Import and analyze game for puzzles
      const { analyzeGameForPuzzles } = await import('./puzzle-detector');
      const candidates = await analyzeGameForPuzzles(
        game,
        engine,
        settings,
        (moveCurrent, moveTotal) => {
          // Report sub-progress if needed
        }
      );

      // Generate puzzles from top candidates (limit to 3 per game)
      const topCandidates = candidates.slice(0, 3);

      for (const candidate of topCandidates) {
        const puzzle = await generatePuzzleFromCandidate(
          candidate,
          game,
          engine,
          userId,
          game.id!
        );
        allPuzzles.push(puzzle);
      }

      if (onProgress) {
        onProgress(i + 1, games.length, allPuzzles.length);
      }
    } catch (error) {
      console.error(`Error processing game ${game.id}:`, error);
    }
  }

  return allPuzzles;
}
