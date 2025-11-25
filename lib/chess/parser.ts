import { Chess } from 'chess.js';
import { ChessComGame, ParsedGame } from '@/app/types/chess';

/**
 * Determines if a result is a win
 */
function isWin(result: string): boolean {
  return result === 'win';
}

/**
 * Determines if a result is a loss
 */
function isLoss(result: string): boolean {
  return [
    'checkmated',
    'timeout',
    'resigned',
    'abandoned',
    'lose',
    'bughousepartnerlose',
  ].includes(result);
}

/**
 * Determines if a result is a draw
 */
function isDraw(result: string): boolean {
  return [
    'agreed',
    'stalemate',
    'repetition',
    'insufficient',
    '50move',
    'timevsinsufficient',
  ].includes(result);
}

/**
 * Parse a Chess.com game into our simplified format
 */
export function parseChessComGame(
  game: ChessComGame,
  playerUsername: string
): ParsedGame {
  const chess = new Chess();

  try {
    chess.loadPgn(game.pgn);
  } catch (error) {
    console.error('Failed to parse PGN:', error);
  }

  // Get PGN headers for opening information
  const headers = chess.header();

  // Determine player color
  const isWhite =
    game.white.username.toLowerCase() === playerUsername.toLowerCase();
  const playerColor = isWhite ? 'white' : 'black';

  // Get player and opponent data
  const playerData = isWhite ? game.white : game.black;
  const opponentData = isWhite ? game.black : game.white;

  // Get move history
  const moves = chess.history();

  // Extract opening name from PGN headers
  const opening = headers.Event || 'Unknown Opening';
  const ecoCode = headers.ECO;
  const ecoUrl = headers.ECOUrl || game.eco;

  // Parse date
  const date = game.end_time
    ? new Date(game.end_time * 1000)
    : new Date();

  // Determine time class
  let timeClass: 'bullet' | 'blitz' | 'rapid' | 'daily' = 'rapid';
  if (game.time_class === 'bullet') timeClass = 'bullet';
  else if (game.time_class === 'blitz') timeClass = 'blitz';
  else if (game.time_class === 'rapid') timeClass = 'rapid';
  else if (game.time_class === 'daily') timeClass = 'daily';

  return {
    id: game.uuid,
    url: game.url,
    date,
    timeControl: game.time_control,
    timeClass,
    rated: game.rated,

    // Player perspective
    playerColor,
    playerRating: playerData.rating,
    playerResult: playerData.result,
    playerWon: isWin(playerData.result),
    playerLost: isLoss(playerData.result),
    playerDrew: isDraw(playerData.result),

    // Opponent
    opponentUsername: opponentData.username,
    opponentRating: opponentData.rating,
    opponentResult: opponentData.result,

    // Opening
    opening,
    ecoCode,
    ecoUrl,

    // Game details
    pgn: game.pgn,
    finalPosition: game.fen,
    moves,
    moveCount: moves.length,

    // Optional analysis
    accuracy: game.accuracies?.[playerColor],
    opponentAccuracy: game.accuracies?.[isWhite ? 'black' : 'white'],
  };
}

/**
 * Parse multiple Chess.com games
 */
export function parseChessComGames(
  games: ChessComGame[],
  playerUsername: string
): ParsedGame[] {
  return games
    .map((game) => parseChessComGame(game, playerUsername))
    .sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort by date descending
}

/**
 * Filter games based on criteria
 */
export function filterGames(
  games: ParsedGame[],
  filters: {
    timeClass?: 'bullet' | 'blitz' | 'rapid' | 'daily';
    result?: 'win' | 'loss' | 'draw';
    color?: 'white' | 'black';
    minRating?: number;
    maxRating?: number;
    startDate?: Date;
    endDate?: Date;
    opening?: string;
  }
): ParsedGame[] {
  return games.filter((game) => {
    // Time class filter
    if (filters.timeClass && game.timeClass !== filters.timeClass) {
      return false;
    }

    // Result filter
    if (filters.result) {
      if (filters.result === 'win' && !game.playerWon) return false;
      if (filters.result === 'loss' && !game.playerLost) return false;
      if (filters.result === 'draw' && !game.playerDrew) return false;
    }

    // Color filter
    if (filters.color && game.playerColor !== filters.color) {
      return false;
    }

    // Rating filters
    if (
      filters.minRating !== undefined &&
      game.opponentRating < filters.minRating
    ) {
      return false;
    }
    if (
      filters.maxRating !== undefined &&
      game.opponentRating > filters.maxRating
    ) {
      return false;
    }

    // Date filters
    if (filters.startDate && game.date < filters.startDate) {
      return false;
    }
    if (filters.endDate && game.date > filters.endDate) {
      return false;
    }

    // Opening filter (partial match, case-insensitive)
    if (
      filters.opening &&
      !game.opening.toLowerCase().includes(filters.opening.toLowerCase()) &&
      !game.ecoCode?.toLowerCase().includes(filters.opening.toLowerCase())
    ) {
      return false;
    }

    return true;
  });
}
