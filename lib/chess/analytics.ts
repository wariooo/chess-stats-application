import { ParsedGame } from '@/app/types/chess';

// Win Rate Analysis

export interface WinRateStats {
  total: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  lossRate: number;
  drawRate: number;
}

export function calculateWinRate(games: ParsedGame[]): WinRateStats {
  const total = games.length;
  const wins = games.filter((g) => g.playerWon).length;
  const losses = games.filter((g) => g.playerLost).length;
  const draws = games.filter((g) => g.playerDrew).length;

  return {
    total,
    wins,
    losses,
    draws,
    winRate: total > 0 ? (wins / total) * 100 : 0,
    lossRate: total > 0 ? (losses / total) * 100 : 0,
    drawRate: total > 0 ? (draws / total) * 100 : 0,
  };
}

export interface WinRateByColor {
  white: WinRateStats;
  black: WinRateStats;
}

export function calculateWinRateByColor(games: ParsedGame[]): WinRateByColor {
  const whiteGames = games.filter((g) => g.playerColor === 'white');
  const blackGames = games.filter((g) => g.playerColor === 'black');

  return {
    white: calculateWinRate(whiteGames),
    black: calculateWinRate(blackGames),
  };
}

export interface WinRateByTimeControl {
  bullet: WinRateStats;
  blitz: WinRateStats;
  rapid: WinRateStats;
  daily: WinRateStats;
}

export function calculateWinRateByTimeControl(
  games: ParsedGame[]
): WinRateByTimeControl {
  const bullet = games.filter((g) => g.timeClass === 'bullet');
  const blitz = games.filter((g) => g.timeClass === 'blitz');
  const rapid = games.filter((g) => g.timeClass === 'rapid');
  const daily = games.filter((g) => g.timeClass === 'daily');

  return {
    bullet: calculateWinRate(bullet),
    blitz: calculateWinRate(blitz),
    rapid: calculateWinRate(rapid),
    daily: calculateWinRate(daily),
  };
}

// Performance vs Rating Ranges

export interface RatingRangePerformance {
  range: string;
  minRating: number;
  maxRating: number;
  games: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
}

export function calculatePerformanceByRatingRange(
  games: ParsedGame[],
  playerAverageRating: number
): RatingRangePerformance[] {
  const ranges: RatingRangePerformance[] = [
    {
      range: 'Much Lower (-200+)',
      minRating: 0,
      maxRating: playerAverageRating - 200,
      games: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
    },
    {
      range: 'Lower (-100 to -200)',
      minRating: playerAverageRating - 200,
      maxRating: playerAverageRating - 100,
      games: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
    },
    {
      range: 'Similar (±100)',
      minRating: playerAverageRating - 100,
      maxRating: playerAverageRating + 100,
      games: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
    },
    {
      range: 'Higher (+100 to +200)',
      minRating: playerAverageRating + 100,
      maxRating: playerAverageRating + 200,
      games: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
    },
    {
      range: 'Much Higher (+200+)',
      minRating: playerAverageRating + 200,
      maxRating: 9999,
      games: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
    },
  ];

  games.forEach((game) => {
    const opponentRating = game.opponentRating;
    const range = ranges.find(
      (r) => opponentRating >= r.minRating && opponentRating < r.maxRating
    );

    if (range) {
      range.games++;
      if (game.playerWon) range.wins++;
      if (game.playerLost) range.losses++;
      if (game.playerDrew) range.draws++;
    }
  });

  // Calculate win rates
  ranges.forEach((range) => {
    range.winRate = range.games > 0 ? (range.wins / range.games) * 100 : 0;
  });

  return ranges.filter((r) => r.games > 0); // Only return ranges with games
}

// Rating Progression

export interface RatingPoint {
  date: Date;
  rating: number;
  timeClass: string;
}

export function calculateRatingProgression(games: ParsedGame[]): RatingPoint[] {
  // Sort games chronologically
  const sortedGames = [...games].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  return sortedGames.map((game) => ({
    date: game.date,
    rating: game.playerRating,
    timeClass: game.timeClass,
  }));
}

export interface RatingProgressionByTimeControl {
  bullet: RatingPoint[];
  blitz: RatingPoint[];
  rapid: RatingPoint[];
  daily: RatingPoint[];
}

export function calculateRatingProgressionByTimeControl(
  games: ParsedGame[]
): RatingProgressionByTimeControl {
  const bullet = games.filter((g) => g.timeClass === 'bullet');
  const blitz = games.filter((g) => g.timeClass === 'blitz');
  const rapid = games.filter((g) => g.timeClass === 'rapid');
  const daily = games.filter((g) => g.timeClass === 'daily');

  return {
    bullet: calculateRatingProgression(bullet),
    blitz: calculateRatingProgression(blitz),
    rapid: calculateRatingProgression(rapid),
    daily: calculateRatingProgression(daily),
  };
}

// Recent Form

export interface RecentForm {
  games: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  trend: 'improving' | 'stable' | 'declining';
  comparison: number; // Percentage difference from overall win rate
}

export function calculateRecentForm(
  games: ParsedGame[],
  lastN: number = 20
): RecentForm {
  // Sort by date descending (most recent first)
  const sortedGames = [...games].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );

  const recentGames = sortedGames.slice(0, lastN);
  const recentStats = calculateWinRate(recentGames);
  const overallStats = calculateWinRate(games);

  const comparison = recentStats.winRate - overallStats.winRate;

  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (comparison > 5) trend = 'improving';
  else if (comparison < -5) trend = 'declining';

  return {
    games: recentStats.total,
    wins: recentStats.wins,
    losses: recentStats.losses,
    draws: recentStats.draws,
    winRate: recentStats.winRate,
    trend,
    comparison,
  };
}

// Streak Detection

export interface Streak {
  type: 'win' | 'loss' | 'draw';
  length: number;
  current: boolean;
  startDate: Date;
  endDate: Date;
}

export function detectStreaks(games: ParsedGame[]): {
  currentStreak: Streak | null;
  longestWinStreak: Streak | null;
  longestLossStreak: Streak | null;
} {
  if (games.length === 0) {
    return {
      currentStreak: null,
      longestWinStreak: null,
      longestLossStreak: null,
    };
  }

  // Sort by date descending (most recent first)
  const sortedGames = [...games].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );

  // Detect current streak
  let currentStreak: Streak | null = null;
  let currentType: 'win' | 'loss' | 'draw' | null = null;
  let currentLength = 0;
  let currentStartDate = sortedGames[0].date;

  for (const game of sortedGames) {
    const gameType = game.playerWon
      ? 'win'
      : game.playerLost
      ? 'loss'
      : 'draw';

    if (currentType === null) {
      currentType = gameType;
      currentLength = 1;
      currentStartDate = game.date;
    } else if (gameType === currentType) {
      currentLength++;
      currentStartDate = game.date;
    } else {
      break;
    }
  }

  if (currentType && currentLength > 0) {
    currentStreak = {
      type: currentType,
      length: currentLength,
      current: true,
      startDate: currentStartDate,
      endDate: sortedGames[0].date,
    };
  }

  // Find longest win and loss streaks
  let longestWinStreak: Streak | null = null;
  let longestLossStreak: Streak | null = null;

  let tempType: 'win' | 'loss' | 'draw' | null = null;
  let tempLength = 0;
  let tempStartDate = sortedGames[0].date;
  let tempEndDate = sortedGames[0].date;

  // Sort chronologically for historical streaks
  const chronological = [...sortedGames].reverse();

  for (let i = 0; i < chronological.length; i++) {
    const game = chronological[i];
    const gameType = game.playerWon
      ? 'win'
      : game.playerLost
      ? 'loss'
      : 'draw';

    if (tempType === null || gameType !== tempType) {
      // Save previous streak if it was significant
      if (tempType === 'win' && tempLength > (longestWinStreak?.length || 0)) {
        longestWinStreak = {
          type: 'win',
          length: tempLength,
          current: false,
          startDate: tempStartDate,
          endDate: tempEndDate,
        };
      } else if (
        tempType === 'loss' &&
        tempLength > (longestLossStreak?.length || 0)
      ) {
        longestLossStreak = {
          type: 'loss',
          length: tempLength,
          current: false,
          startDate: tempStartDate,
          endDate: tempEndDate,
        };
      }

      // Start new streak
      tempType = gameType;
      tempLength = 1;
      tempStartDate = game.date;
      tempEndDate = game.date;
    } else {
      tempLength++;
      tempEndDate = game.date;
    }
  }

  // Check final streak
  if (tempType === 'win' && tempLength > (longestWinStreak?.length || 0)) {
    longestWinStreak = {
      type: 'win',
      length: tempLength,
      current: false,
      startDate: tempStartDate,
      endDate: tempEndDate,
    };
  } else if (
    tempType === 'loss' &&
    tempLength > (longestLossStreak?.length || 0)
  ) {
    longestLossStreak = {
      type: 'loss',
      length: tempLength,
      current: false,
      startDate: tempStartDate,
      endDate: tempEndDate,
    };
  }

  return {
    currentStreak,
    longestWinStreak,
    longestLossStreak,
  };
}

// Personal Records

export interface PersonalRecords {
  highestRating: {
    rating: number;
    date: Date;
    timeClass: string;
  } | null;
  longestGame: {
    moves: number;
    url: string;
    date: Date;
    opponent: string;
  } | null;
  biggestUpset: {
    ratingDifference: number;
    opponentRating: number;
    playerRating: number;
    url: string;
    date: Date;
    opponent: string;
  } | null;
}

export function calculatePersonalRecords(games: ParsedGame[]): PersonalRecords {
  if (games.length === 0) {
    return {
      highestRating: null,
      longestGame: null,
      biggestUpset: null,
    };
  }

  // Highest rating
  const highestRatingGame = games.reduce((max, game) =>
    game.playerRating > max.playerRating ? game : max
  );

  const highestRating = {
    rating: highestRatingGame.playerRating,
    date: highestRatingGame.date,
    timeClass: highestRatingGame.timeClass,
  };

  // Longest game (by move count)
  const longestGameData = games.reduce((max, game) =>
    game.moveCount > max.moveCount ? game : max
  );

  const longestGame = {
    moves: longestGameData.moveCount,
    url: longestGameData.url,
    date: longestGameData.date,
    opponent: longestGameData.opponentUsername,
  };

  // Biggest upset (won against much higher rated opponent)
  const wonGames = games.filter((g) => g.playerWon);
  const biggestUpsetGame =
    wonGames.length > 0
      ? wonGames.reduce((max, game) => {
          const diff = game.opponentRating - game.playerRating;
          const maxDiff = max.opponentRating - max.playerRating;
          return diff > maxDiff ? game : max;
        })
      : null;

  const biggestUpset = biggestUpsetGame
    ? {
        ratingDifference: biggestUpsetGame.opponentRating - biggestUpsetGame.playerRating,
        opponentRating: biggestUpsetGame.opponentRating,
        playerRating: biggestUpsetGame.playerRating,
        url: biggestUpsetGame.url,
        date: biggestUpsetGame.date,
        opponent: biggestUpsetGame.opponentUsername,
      }
    : null;

  return {
    highestRating,
    longestGame,
    biggestUpset,
  };
}

// Opening Analysis

export interface OpeningStats {
  opening: string; // SAN sequence of first 8 plies (4 full moves)
  gamesCount: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  lossRate: number;
  drawRate: number;
  asWhite: {
    games: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
  };
  asBlack: {
    games: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
  };
  averageOpponentRating: number;
  lastPlayed: Date;
}

/**
 * Extract the opening sequence (first 8 plies / 4 full moves) from a game
 */
export function extractOpeningSequence(moves: string[], plies: number = 8): string {
  const openingMoves = moves.slice(0, plies);
  return openingMoves.join(' ');
}

/**
 * Analyze openings from a set of games
 * Groups games by their first 8 plies and calculates statistics
 */
export function analyzeOpenings(games: ParsedGame[], plies: number = 8): OpeningStats[] {
  const openingMap = new Map<string, {
    games: ParsedGame[];
    wins: number;
    losses: number;
    draws: number;
    whiteGames: ParsedGame[];
    blackGames: ParsedGame[];
  }>();

  // Group games by opening sequence
  for (const game of games) {
    // Skip games with fewer moves than required for opening
    if (game.moves.length < plies) continue;

    const openingSeq = extractOpeningSequence(game.moves, plies);

    if (!openingMap.has(openingSeq)) {
      openingMap.set(openingSeq, {
        games: [],
        wins: 0,
        losses: 0,
        draws: 0,
        whiteGames: [],
        blackGames: [],
      });
    }

    const entry = openingMap.get(openingSeq)!;
    entry.games.push(game);

    if (game.playerWon) entry.wins++;
    else if (game.playerLost) entry.losses++;
    else entry.draws++;

    if (game.playerColor === 'white') {
      entry.whiteGames.push(game);
    } else {
      entry.blackGames.push(game);
    }
  }

  // Convert to OpeningStats array
  const openingStats: OpeningStats[] = [];

  for (const [opening, data] of openingMap) {
    const total = data.games.length;

    // Calculate white stats
    const whiteWins = data.whiteGames.filter(g => g.playerWon).length;
    const whiteLosses = data.whiteGames.filter(g => g.playerLost).length;
    const whiteDraws = data.whiteGames.filter(g => g.playerDrew).length;
    const whiteTotal = data.whiteGames.length;

    // Calculate black stats
    const blackWins = data.blackGames.filter(g => g.playerWon).length;
    const blackLosses = data.blackGames.filter(g => g.playerLost).length;
    const blackDraws = data.blackGames.filter(g => g.playerDrew).length;
    const blackTotal = data.blackGames.length;

    // Calculate average opponent rating
    const totalOpponentRating = data.games.reduce((sum, g) => sum + g.opponentRating, 0);
    const averageOpponentRating = Math.round(totalOpponentRating / total);

    // Find most recent game
    const sortedByDate = [...data.games].sort((a, b) => b.date.getTime() - a.date.getTime());
    const lastPlayed = sortedByDate[0].date;

    openingStats.push({
      opening,
      gamesCount: total,
      wins: data.wins,
      losses: data.losses,
      draws: data.draws,
      winRate: total > 0 ? (data.wins / total) * 100 : 0,
      lossRate: total > 0 ? (data.losses / total) * 100 : 0,
      drawRate: total > 0 ? (data.draws / total) * 100 : 0,
      asWhite: {
        games: whiteTotal,
        wins: whiteWins,
        losses: whiteLosses,
        draws: whiteDraws,
        winRate: whiteTotal > 0 ? (whiteWins / whiteTotal) * 100 : 0,
      },
      asBlack: {
        games: blackTotal,
        wins: blackWins,
        losses: blackLosses,
        draws: blackDraws,
        winRate: blackTotal > 0 ? (blackWins / blackTotal) * 100 : 0,
      },
      averageOpponentRating,
      lastPlayed,
    });
  }

  // Sort by games count descending
  return openingStats.sort((a, b) => b.gamesCount - a.gamesCount);
}

/**
 * Get top performing openings (by win rate, with minimum games threshold)
 */
export function getTopOpenings(
  openingStats: OpeningStats[],
  minGames: number = 3,
  limit: number = 10
): OpeningStats[] {
  return openingStats
    .filter(o => o.gamesCount >= minGames)
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, limit);
}

/**
 * Get worst performing openings (by win rate, with minimum games threshold)
 */
export function getWorstOpenings(
  openingStats: OpeningStats[],
  minGames: number = 3,
  limit: number = 10
): OpeningStats[] {
  return openingStats
    .filter(o => o.gamesCount >= minGames)
    .sort((a, b) => a.winRate - b.winRate)
    .slice(0, limit);
}

/**
 * Get most played openings
 */
export function getMostPlayedOpenings(
  openingStats: OpeningStats[],
  limit: number = 10
): OpeningStats[] {
  return openingStats.slice(0, limit);
}

/**
 * Filter openings by color
 */
export function filterOpeningsByColor(
  openingStats: OpeningStats[],
  color: 'white' | 'black'
): OpeningStats[] {
  return openingStats.filter(o => {
    if (color === 'white') return o.asWhite.games > 0;
    return o.asBlack.games > 0;
  });
}
