export interface GameStats {
  last: {
    rating: number;
    date: number;
    rd: number;
  };
  best: {
    rating: number;
    date: number;
    game: string;
  };
  record: {
    win: number;
    loss: number;
    draw: number;
  };
}

export interface ChessStats {
  chess_bullet?: GameStats;
  chess_blitz?: GameStats;
  chess_rapid?: GameStats;
  chess_daily?: GameStats;
}

export interface ChessApiError {
  error: string;
}

export type ChessApiResponse = ChessStats | ChessApiError;

export function isChessApiError(
  response: ChessApiResponse
): response is ChessApiError {
  return 'error' in response;
}

// Game Archives Types
export interface ArchivesResponse {
  archives: string[];
}

// Chess.com Game Types
export interface ChessComPlayer {
  rating: number;
  result: string;
  id: string;
  username: string;
  uuid?: string;
}

export interface ChessComGame {
  url: string;
  pgn: string;
  time_control: string;
  end_time: number;
  rated: boolean;
  tcn?: string;
  uuid: string;
  initial_setup: string;
  fen: string;
  time_class: string;
  rules: string;
  white: ChessComPlayer;
  black: ChessComPlayer;
  eco?: string;
  start_time?: number;
  accuracies?: {
    white?: number;
    black?: number;
  };
}

export interface MonthlyGamesResponse {
  games: ChessComGame[];
}

// Parsed Game Data (for client-side use)
export interface ParsedGame {
  id: string;
  url: string;
  date: Date;
  timeControl: string;
  timeClass: 'bullet' | 'blitz' | 'rapid' | 'daily';
  rated: boolean;

  // Player perspective
  playerColor: 'white' | 'black';
  playerRating: number;
  playerResult: string;
  playerWon: boolean;
  playerLost: boolean;
  playerDrew: boolean;

  // Opponent
  opponentUsername: string;
  opponentRating: number;
  opponentResult: string;

  // Opening
  opening: string;
  ecoCode?: string;
  ecoUrl?: string;

  // Game details
  pgn: string;
  finalPosition: string;
  moves: string[];
  moveCount: number;

  // Optional analysis
  accuracy?: number;
  opponentAccuracy?: number;
}

export interface GameFilters {
  timeClass?: 'bullet' | 'blitz' | 'rapid' | 'daily';
  result?: 'win' | 'loss' | 'draw';
  color?: 'white' | 'black';
  minRating?: number;
  maxRating?: number;
  startDate?: Date;
  endDate?: Date;
  opening?: string;
}
