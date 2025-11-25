import { Chess, Square } from 'chess.js';
import { TacticalTheme, EngineEvaluation } from './types';
import { TACTICAL_THEMES, PIECE_VALUES } from './constants';

export function classifyThemes(
  fen: string,
  solution: string[],
  engineAnalysis: EngineEvaluation[]
): TacticalTheme[] {
  const themes: TacticalTheme[] = [];
  const chess = new Chess(fen);

  if (solution.length === 0) return themes;

  const firstMove = solution[0];
  const beforeFen = chess.fen();

  // Make the first move
  const from = firstMove.substring(0, 2) as Square;
  const to = firstMove.substring(2, 4) as Square;
  const promotion = firstMove.length > 4 ? firstMove[4] : undefined;

  chess.move({ from, to, promotion });

  // Check for various themes
  if (chess.isCheckmate()) {
    if (isBackRankMate(chess)) {
      themes.push(TACTICAL_THEMES.backRankMate);
    }
    if (isSmotheredMate(chess)) {
      themes.push(TACTICAL_THEMES.smotheredMate);
    }
  }

  if (chess.isCheck()) {
    const checks = getCheckingPieces(chess);
    if (checks.length > 1) {
      themes.push(TACTICAL_THEMES.doubleCheck);
    }
  }

  // Load before position to check for discovered attack
  const beforeChess = new Chess(beforeFen);
  if (isDiscoveredAttack(beforeChess, from, to)) {
    themes.push(TACTICAL_THEMES.discoveredAttack);
  }

  // Check for fork
  if (isFork(chess, to)) {
    themes.push(TACTICAL_THEMES.fork);
  }

  // Check for pin
  if (createsPin(chess, to)) {
    themes.push(TACTICAL_THEMES.pin);
  }

  // Check for skewer
  if (createsSkewer(chess, to)) {
    themes.push(TACTICAL_THEMES.skewer);
  }

  // Check if it's a capture
  const capturedPiece = beforeChess.get(to);
  if (capturedPiece) {
    const movingPiece = beforeChess.get(from);
    if (movingPiece && capturedPiece) {
      // Winning exchange
      const movingValue = PIECE_VALUES[movingPiece.type];
      const capturedValue = PIECE_VALUES[capturedPiece.type];
      if (capturedValue > movingValue) {
        themes.push(TACTICAL_THEMES.winningExchange);
      }
    }
  }

  // Check for trapped piece
  if (isTrappedPiece(chess, engineAnalysis)) {
    themes.push(TACTICAL_THEMES.trappedPiece);
  }

  // Check for promotion
  if (promotion) {
    themes.push(TACTICAL_THEMES.promotion);
  }

  return themes;
}

function isBackRankMate(chess: Chess): boolean {
  const board = chess.board();
  const turn = chess.turn();

  // Find king position
  let kingSquare: { rank: number; file: number } | null = null;
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = board[rank][file];
      if (piece && piece.type === 'k' && piece.color !== turn) {
        kingSquare = { rank, file };
        break;
      }
    }
  }

  if (!kingSquare) return false;

  // Check if king is on back rank (rank 0 for black, rank 7 for white)
  const isOnBackRank =
    (turn === 'w' && kingSquare.rank === 0) ||
    (turn === 'b' && kingSquare.rank === 7);

  return isOnBackRank;
}

function isSmotheredMate(chess: Chess): boolean {
  if (!chess.isCheckmate()) return false;

  const board = chess.board();
  const turn = chess.turn();

  // Find king and checking piece
  let kingSquare: { rank: number; file: number } | null = null;
  let hasKnightCheck = false;

  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = board[rank][file];
      if (piece && piece.type === 'k' && piece.color !== turn) {
        kingSquare = { rank, file };
      }
    }
  }

  if (!kingSquare) return false;

  // Check if it's a knight delivering checkmate
  const checks = getCheckingPieces(chess);
  hasKnightCheck = checks.some((sq) => {
    const piece = chess.get(sq);
    return piece && piece.type === 'n';
  });

  // Check if king is surrounded by its own pieces
  if (hasKnightCheck && kingSquare) {
    const surroundedByOwn = isKingSurrounded(chess, kingSquare);
    return surroundedByOwn;
  }

  return false;
}

function isKingSurrounded(
  chess: Chess,
  kingSquare: { rank: number; file: number }
): boolean {
  const board = chess.board();
  const kingColor = board[kingSquare.rank][kingSquare.file]?.color;

  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
  ];

  let blockedSquares = 0;
  for (const [dr, df] of directions) {
    const newRank = kingSquare.rank + dr;
    const newFile = kingSquare.file + df;

    if (newRank < 0 || newRank > 7 || newFile < 0 || newFile > 7) {
      blockedSquares++;
      continue;
    }

    const piece = board[newRank][newFile];
    if (piece && piece.color === kingColor) {
      blockedSquares++;
    }
  }

  return blockedSquares >= 6;
}

function getCheckingPieces(chess: Chess): Square[] {
  const checking: Square[] = [];
  const board = chess.board();
  const turn = chess.turn();

  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = board[rank][file];
      if (piece && piece.color === turn) {
        const square = getSquareName(rank, file);
        const moves = chess.moves({ square, verbose: true });
        const givesCheck = moves.some((m: any) =>
          m.san.includes('+') || m.san.includes('#')
        );
        if (givesCheck) {
          checking.push(square);
        }
      }
    }
  }

  return checking;
}

function isDiscoveredAttack(
  beforeChess: Chess,
  from: Square,
  to: Square
): boolean {
  const movingPiece = beforeChess.get(from);
  if (!movingPiece) return false;

  // Check lines from the 'from' square
  const lines = getLinesFromSquare(from);

  for (const line of lines) {
    let foundAttacker = false;
    let foundTarget = false;

    for (const square of line) {
      if (square === from) continue;

      const piece = beforeChess.get(square);
      if (!piece) continue;

      if (piece.color === movingPiece.color &&
          ['q', 'r', 'b'].includes(piece.type)) {
        foundAttacker = true;
      } else if (piece.color !== movingPiece.color &&
                 ['q', 'r', 'k'].includes(piece.type)) {
        foundTarget = true;
      }

      if (foundAttacker && foundTarget) return true;
    }
  }

  return false;
}

function getLinesFromSquare(square: Square): Square[][] {
  // Returns all lines (horizontal, vertical, diagonal) from a square
  // Simplified implementation
  return [];
}

function isFork(chess: Chess, square: Square): boolean {
  const piece = chess.get(square);
  if (!piece) return false;

  const attacks = getAttackedSquares(chess, square);
  const valuableTargets = attacks.filter((sq) => {
    const target = chess.get(sq);
    return target &&
           target.color !== piece.color &&
           ['q', 'r', 'k'].includes(target.type);
  });

  return valuableTargets.length >= 2;
}

function getAttackedSquares(chess: Chess, square: Square): Square[] {
  const moves = chess.moves({ square, verbose: true });
  return moves.map((m: any) => m.to);
}

function createsPin(chess: Chess, square: Square): boolean {
  // Simplified pin detection
  const piece = chess.get(square);
  if (!piece) return false;

  return ['q', 'r', 'b'].includes(piece.type);
}

function createsSkewer(chess: Chess, square: Square): boolean {
  // Simplified skewer detection
  const piece = chess.get(square);
  if (!piece) return false;

  return ['q', 'r', 'b'].includes(piece.type);
}

function isTrappedPiece(chess: Chess, engineAnalysis: EngineEvaluation[]): boolean {
  // Check if opponent's valuable piece has no safe squares
  const board = chess.board();
  const turn = chess.turn();

  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = board[rank][file];
      if (piece && piece.color !== turn && ['q', 'r', 'n'].includes(piece.type)) {
        const square = getSquareName(rank, file);
        const moves = chess.moves({ square });
        if (moves.length === 0 || moves.length === 1) {
          return true;
        }
      }
    }
  }

  return false;
}

function getSquareName(rank: number, file: number): Square {
  const files = 'abcdefgh';
  return `${files[file]}${8 - rank}` as Square;
}
