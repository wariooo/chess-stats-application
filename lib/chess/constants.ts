import { TacticalTheme } from './types';

// Tactical theme definitions
export const TACTICAL_THEMES: Record<string, TacticalTheme> = {
  // Attacking themes
  fork: { id: 'fork', name: 'Fork', category: 'attacking' },
  pin: { id: 'pin', name: 'Pin', category: 'attacking' },
  skewer: { id: 'skewer', name: 'Skewer', category: 'attacking' },
  discoveredAttack: {
    id: 'discoveredAttack',
    name: 'Discovered Attack',
    category: 'attacking',
  },
  doubleCheck: {
    id: 'doubleCheck',
    name: 'Double Check',
    category: 'attacking',
  },
  backRankMate: {
    id: 'backRankMate',
    name: 'Back Rank Mate',
    category: 'attacking',
  },
  smotheredMate: {
    id: 'smotheredMate',
    name: 'Smothered Mate',
    category: 'attacking',
  },

  // Defensive themes
  onlyDefense: {
    id: 'onlyDefense',
    name: 'Only Defense',
    category: 'defensive',
  },
  defensiveResource: {
    id: 'defensiveResource',
    name: 'Defensive Resource',
    category: 'defensive',
  },
  staleMateTrick: {
    id: 'staleMateTrick',
    name: 'Stalemate Trick',
    category: 'defensive',
  },

  // Material themes
  winningExchange: {
    id: 'winningExchange',
    name: 'Winning Exchange',
    category: 'material',
  },
  trappedPiece: {
    id: 'trappedPiece',
    name: 'Trapped Piece',
    category: 'material',
  },
  overloading: { id: 'overloading', name: 'Overloading', category: 'material' },
  removingDefender: {
    id: 'removingDefender',
    name: 'Removing Defender',
    category: 'material',
  },
  hangingPiece: {
    id: 'hangingPiece',
    name: 'Hanging Piece',
    category: 'material',
  },

  // Positional themes
  prophylaxis: {
    id: 'prophylaxis',
    name: 'Prophylaxis',
    category: 'positional',
  },
  pieceActivation: {
    id: 'pieceActivation',
    name: 'Piece Activation',
    category: 'positional',
  },
  pawnBreak: { id: 'pawnBreak', name: 'Pawn Break', category: 'positional' },
  zugzwang: { id: 'zugzwang', name: 'Zugzwang', category: 'positional' },

  // Endgame themes
  opposition: { id: 'opposition', name: 'Opposition', category: 'endgame' },
  promotion: { id: 'promotion', name: 'Promotion', category: 'endgame' },
  keySquares: { id: 'keySquares', name: 'Key Squares', category: 'endgame' },
};

export const THEME_RARITY: Record<string, number> = {
  fork: 0,
  pin: 0,
  backRankMate: 0,
  discoveredAttack: 1,
  skewer: 1,
  overloading: 1,
  smotheredMate: 2,
  zugzwang: 2,
  staleMateTrick: 2,
};

export const PIECE_VALUES: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: Infinity,
};
