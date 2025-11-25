// Core types for the chess puzzle generator

export interface EngineEvaluation {
  move: string; // UCI format (e.g., "e2e4")
  moveSan: string; // SAN format (e.g., "e4")
  eval: number; // Centipawns (positive = white advantage)
  mate: number | null; // Moves to mate if applicable
  pv: string[]; // Principal variation (best line)
  depth: number;
}

export interface PositionAnalysis {
  fen: string;
  moveNumber: number;
  sideToMove: 'white' | 'black';
  topMoves: EngineEvaluation[]; // Top 3-5 moves
  evalGap: number; // Difference between #1 and #2
  isOnlyMove: boolean;
  playerMove: string | null; // What the player actually played
  playerFoundIt: boolean; // Did they find the best move?
}

export interface TacticalTheme {
  id: string;
  name: string;
  category: 'attacking' | 'defensive' | 'material' | 'positional' | 'endgame';
}

export interface PuzzleExplanation {
  context: string; // What's happening in the position
  keyIdea: string; // Why the move works
  continuation: string; // What happens after correct play
  alternatives: string; // Why other moves fail
}

export interface PuzzleData {
  id?: number;
  userId: number;
  gameId: number;
  fen: string; // Starting position
  sideToMove: 'white' | 'black';
  solution: string[]; // Moves in UCI format
  solutionSan: string[]; // Moves in SAN format
  themes: TacticalTheme[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  moveNumber: number;
  playerFoundIt: boolean;
  explanation: PuzzleExplanation;
  source?: {
    white: string;
    black: string;
    whiteElo: number;
    blackElo: number;
    result: string;
    playedAt: string;
    url: string;
  };
  createdAt?: Date;
}

export interface PuzzleCandidate {
  fen: string;
  moveNumber: number;
  sideToMove: 'white' | 'black';
  bestMove: EngineEvaluation;
  secondBest: EngineEvaluation;
  evalGap: number;
  playerMove: string;
  playerFoundIt: boolean;
  qualityScore: number;
}

export interface PuzzleAttemptData {
  id?: number;
  puzzleId: number;
  userId: number;
  solved: boolean;
  attempts: number;
  hintsUsed: number;
  timeSpent: number; // milliseconds
  attemptedAt?: Date;
}

export interface ChessGameData {
  id?: number;
  userId: number;
  chesscomUrl: string;
  white: string;
  black: string;
  whiteElo: number | null;
  blackElo: number | null;
  result: string;
  timeControl: string | null;
  pgn: string;
  playedAt: Date;
  createdAt?: Date;
}

export interface PuzzleGenerationSettings {
  evalGapThreshold: number; // Default: 150 centipawns
  minMoveNumber: number; // Default: 10 (skip opening)
  maxEvalForPuzzle: number; // Default: 600 (skip won positions)
  engineDepth: number; // Default: 18
  multiPvCount: number; // Default: 3
}

export const DEFAULT_PUZZLE_SETTINGS: PuzzleGenerationSettings = {
  evalGapThreshold: 150,
  minMoveNumber: 10,
  maxEvalForPuzzle: 600,
  engineDepth: 18,
  multiPvCount: 3,
};

export interface UserProgress {
  totalPuzzles: number;
  totalSolved: number;
  totalAttempted: number;
  averageAttempts: number;
  solvedByDifficulty: Record<number, number>;
  solvedByTheme: Record<string, number>;
}
