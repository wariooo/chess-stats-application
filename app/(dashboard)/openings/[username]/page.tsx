'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { OpeningStats } from '@/lib/chess/analytics';

interface OpeningsApiResponse {
  username: string;
  summary: {
    totalGamesAnalyzed: number;
    gamesWithOpenings: number;
    uniqueOpenings: number;
    monthsAnalyzed: number;
    pliesUsed: number;
    timeClass: string;
    dateRange: {
      from: string | null;
      to: string | null;
    };
  };
  openings: OpeningStats[];
  error?: string;
}

interface PageProps {
  params: Promise<{ username: string }>;
}

type SortOption = 'games' | 'winRate' | 'recent';
type ColorFilter = 'all' | 'white' | 'black';
type TimeClassFilter = 'all' | 'bullet' | 'blitz' | 'rapid' | 'daily';

export default function OpeningsPage({ params }: PageProps) {
  const { username } = use(params);
  const [data, setData] = useState<OpeningsApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters and sorting
  const [sortBy, setSortBy] = useState<SortOption>('games');
  const [colorFilter, setColorFilter] = useState<ColorFilter>('all');
  const [timeClass, setTimeClass] = useState<TimeClassFilter>('all');
  const [minGames, setMinGames] = useState(1);

  // Fetch data
  useEffect(() => {
    async function fetchOpenings() {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          months: '3',
          plies: '8',
        });
        if (timeClass !== 'all') {
          params.set('timeClass', timeClass);
        }

        const response = await fetch(`/api/chess/openings/${username.toLowerCase()}?${params}`);
        const result = await response.json();

        if (!response.ok || result.error) {
          setError(result.error || 'Failed to fetch opening analysis');
          return;
        }

        // Parse dates from strings
        result.openings = result.openings.map((o: OpeningStats & { lastPlayed: string }) => ({
          ...o,
          lastPlayed: new Date(o.lastPlayed),
        }));

        setData(result);
      } catch (err) {
        setError('An unexpected error occurred');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOpenings();
  }, [username, timeClass]);

  // Filter and sort openings
  const filteredOpenings = data?.openings
    .filter((o) => {
      if (o.gamesCount < minGames) return false;
      if (colorFilter === 'white' && o.asWhite.games === 0) return false;
      if (colorFilter === 'black' && o.asBlack.games === 0) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'winRate':
          return b.winRate - a.winRate;
        case 'recent':
          return b.lastPlayed.getTime() - a.lastPlayed.getTime();
        case 'games':
        default:
          return b.gamesCount - a.gamesCount;
      }
    }) || [];

  // Calculate aggregate stats for filtered openings
  const aggregateStats = filteredOpenings.reduce(
    (acc, o) => ({
      totalGames: acc.totalGames + o.gamesCount,
      totalWins: acc.totalWins + o.wins,
      totalLosses: acc.totalLosses + o.losses,
      totalDraws: acc.totalDraws + o.draws,
    }),
    { totalGames: 0, totalWins: 0, totalLosses: 0, totalDraws: 0 }
  );

  const overallWinRate = aggregateStats.totalGames > 0
    ? (aggregateStats.totalWins / aggregateStats.totalGames) * 100
    : 0;

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#2a2a2a]">
        <Sidebar username={username} />
        <div className="flex-1 p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-700 rounded w-64"></div>
            <div className="h-4 bg-gray-700 rounded w-96"></div>
            <div className="grid grid-cols-4 gap-4 mt-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-700 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-700 rounded-lg mt-8"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-[#2a2a2a]">
        <Sidebar username={username} />
        <div className="flex-1 p-8 flex items-center justify-center">
          <Card className="bg-[#1e1e1e] border-red-800 max-w-md">
            <CardContent className="pt-6 text-center">
              <p className="text-white text-lg mb-2">{error}</p>
              <p className="text-gray-400 mb-4">Please check the username and try again.</p>
              <Link href="/">
                <Button className="bg-orange-500 hover:bg-orange-600">Back to Search</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#2a2a2a]">
      <Sidebar username={username} />

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Opening Analysis</h1>
          <p className="text-gray-400 mt-1">
            Analyzing <span className="text-white font-semibold">{data?.summary.totalGamesAnalyzed}</span> games
            from the last <span className="text-white font-semibold">{data?.summary.monthsAnalyzed}</span> months
          </p>
          {data?.summary.dateRange.from && data?.summary.dateRange.to && (
            <p className="text-gray-500 text-sm mt-1">
              {new Date(data.summary.dateRange.from).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              {' - '}
              {new Date(data.summary.dateRange.to).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="bg-[#1e1e1e] border-gray-800">
            <CardContent className="p-6">
              <p className="text-gray-400 text-sm mb-1">Unique Openings</p>
              <p className="text-3xl font-bold text-white">{data?.summary.uniqueOpenings}</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1e1e1e] border-gray-800">
            <CardContent className="p-6">
              <p className="text-gray-400 text-sm mb-1">Games Analyzed</p>
              <p className="text-3xl font-bold text-white">{data?.summary.gamesWithOpenings}</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1e1e1e] border-gray-800">
            <CardContent className="p-6">
              <p className="text-gray-400 text-sm mb-1">Overall Win Rate</p>
              <p className="text-3xl font-bold text-orange-500">{overallWinRate.toFixed(1)}%</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1e1e1e] border-gray-800">
            <CardContent className="p-6">
              <p className="text-gray-400 text-sm mb-1">W / L / D</p>
              <p className="text-lg font-bold">
                <span className="text-green-500">{aggregateStats.totalWins}</span>
                {' / '}
                <span className="text-red-500">{aggregateStats.totalLosses}</span>
                {' / '}
                <span className="text-gray-400">{aggregateStats.totalDraws}</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Sort By */}
          <div>
            <label className="text-gray-400 text-sm block mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-[#1e1e1e] text-white border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
            >
              <option value="games">Most Played</option>
              <option value="winRate">Win Rate</option>
              <option value="recent">Recently Played</option>
            </select>
          </div>

          {/* Color Filter */}
          <div>
            <label className="text-gray-400 text-sm block mb-1">Color</label>
            <select
              value={colorFilter}
              onChange={(e) => setColorFilter(e.target.value as ColorFilter)}
              className="bg-[#1e1e1e] text-white border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
            >
              <option value="all">All Colors</option>
              <option value="white">As White</option>
              <option value="black">As Black</option>
            </select>
          </div>

          {/* Time Class Filter */}
          <div>
            <label className="text-gray-400 text-sm block mb-1">Time Control</label>
            <select
              value={timeClass}
              onChange={(e) => setTimeClass(e.target.value as TimeClassFilter)}
              className="bg-[#1e1e1e] text-white border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
            >
              <option value="all">All</option>
              <option value="bullet">Bullet</option>
              <option value="blitz">Blitz</option>
              <option value="rapid">Rapid</option>
              <option value="daily">Daily</option>
            </select>
          </div>

          {/* Min Games Filter */}
          <div>
            <label className="text-gray-400 text-sm block mb-1">Min Games</label>
            <select
              value={minGames}
              onChange={(e) => setMinGames(parseInt(e.target.value))}
              className="bg-[#1e1e1e] text-white border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
            >
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="5">5+</option>
              <option value="10">10+</option>
            </select>
          </div>
        </div>

        {/* Opening List */}
        <Card className="bg-[#1e1e1e] border-gray-800">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 text-sm border-b border-gray-700">
                    <th className="text-left py-4 px-6 font-medium">OPENING MOVES</th>
                    <th className="text-center py-4 px-4 font-medium">GAMES</th>
                    <th className="text-center py-4 px-4 font-medium">WIN RATE</th>
                    <th className="text-center py-4 px-4 font-medium">W / L / D</th>
                    <th className="text-center py-4 px-4 font-medium">AVG OPP.</th>
                    <th className="text-center py-4 px-4 font-medium">LAST PLAYED</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOpenings.map((opening, index) => (
                    <OpeningRow
                      key={index}
                      opening={opening}
                      colorFilter={colorFilter}
                    />
                  ))}
                  {filteredOpenings.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        No openings found matching the current filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Info Footer */}
        <div className="mt-6 text-gray-500 text-sm">
          <p>
            Openings are identified by the first 4 full moves (8 plies) of each game.
            Games with fewer moves are excluded from analysis.
          </p>
        </div>
      </div>
    </div>
  );
}

// Sidebar Component
function Sidebar({ username }: { username: string }) {
  return (
    <div className="w-64 bg-[#1e1e1e] p-6 flex flex-col">
      {/* Player Info */}
      <div className="mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg mb-4 flex items-center justify-center text-white text-2xl font-bold">
          {username.charAt(0).toUpperCase()}
        </div>
        <h2 className="text-white text-xl font-semibold capitalize">{username}</h2>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-gray-400 text-sm">Opening Analysis</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-2 flex-1">
        <Link
          href={`/player/${username}`}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-gray-400 hover:bg-[#2a2a2a] hover:text-white transition-colors"
        >
          <span className="text-lg">Home</span>
          <span>Overview</span>
        </Link>

        <div
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left bg-[#2a2a2a] text-orange-500"
        >
          <span className="text-lg">Book</span>
          <span>Openings</span>
        </div>
      </nav>

      {/* Back Link */}
      <Link href={`/player/${username}`} className="text-gray-500 hover:text-orange-500 text-sm mt-auto">
        Back to player profile
      </Link>
    </div>
  );
}

// Opening Row Component
function OpeningRow({
  opening,
  colorFilter,
}: {
  opening: OpeningStats;
  colorFilter: ColorFilter;
}) {
  const [expanded, setExpanded] = useState(false);

  // Format the opening moves for display
  const formatMoves = (movesString: string) => {
    const moves = movesString.split(' ');
    const formatted: string[] = [];
    for (let i = 0; i < moves.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      const whiteMove = moves[i];
      const blackMove = moves[i + 1] || '';
      formatted.push(`${moveNum}. ${whiteMove}${blackMove ? ' ' + blackMove : ''}`);
    }
    return formatted.join(' ');
  };

  // Get win rate based on color filter
  const getDisplayWinRate = () => {
    if (colorFilter === 'white') return opening.asWhite.winRate;
    if (colorFilter === 'black') return opening.asBlack.winRate;
    return opening.winRate;
  };

  // Get games based on color filter
  const getDisplayGames = () => {
    if (colorFilter === 'white') return opening.asWhite.games;
    if (colorFilter === 'black') return opening.asBlack.games;
    return opening.gamesCount;
  };

  // Get W/L/D based on color filter
  const getDisplayWLD = () => {
    if (colorFilter === 'white') {
      return { wins: opening.asWhite.wins, losses: opening.asWhite.losses, draws: opening.asWhite.draws };
    }
    if (colorFilter === 'black') {
      return { wins: opening.asBlack.wins, losses: opening.asBlack.losses, draws: opening.asBlack.draws };
    }
    return { wins: opening.wins, losses: opening.losses, draws: opening.draws };
  };

  const winRate = getDisplayWinRate();
  const wld = getDisplayWLD();

  // Determine win rate color
  const getWinRateColor = (rate: number) => {
    if (rate >= 60) return 'text-green-500';
    if (rate >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <>
      <tr
        className="border-b border-gray-800 hover:bg-[#252525] cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="py-4 px-6">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs">{expanded ? 'v' : '>'}</span>
            <code className="text-white text-sm font-mono">{formatMoves(opening.opening)}</code>
          </div>
        </td>
        <td className="py-4 px-4 text-center text-white font-medium">{getDisplayGames()}</td>
        <td className="py-4 px-4 text-center">
          <span className={`font-bold ${getWinRateColor(winRate)}`}>
            {winRate.toFixed(1)}%
          </span>
        </td>
        <td className="py-4 px-4 text-center">
          <span className="text-green-500">{wld.wins}</span>
          {' / '}
          <span className="text-red-500">{wld.losses}</span>
          {' / '}
          <span className="text-gray-400">{wld.draws}</span>
        </td>
        <td className="py-4 px-4 text-center text-gray-400">{opening.averageOpponentRating}</td>
        <td className="py-4 px-4 text-center text-gray-400">
          {opening.lastPlayed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </td>
      </tr>

      {/* Expanded Details */}
      {expanded && (
        <tr className="bg-[#252525]">
          <td colSpan={6} className="px-6 py-4">
            <div className="grid grid-cols-2 gap-6">
              {/* As White Stats */}
              <div className="bg-[#1e1e1e] rounded-lg p-4">
                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-white"></span> As White
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Games</span>
                    <span className="text-white">{opening.asWhite.games}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Win Rate</span>
                    <span className={getWinRateColor(opening.asWhite.winRate)}>
                      {opening.asWhite.winRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Record</span>
                    <span>
                      <span className="text-green-500">{opening.asWhite.wins}</span>
                      {' / '}
                      <span className="text-red-500">{opening.asWhite.losses}</span>
                      {' / '}
                      <span className="text-gray-400">{opening.asWhite.draws}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* As Black Stats */}
              <div className="bg-[#1e1e1e] rounded-lg p-4">
                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-gray-700"></span> As Black
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Games</span>
                    <span className="text-white">{opening.asBlack.games}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Win Rate</span>
                    <span className={getWinRateColor(opening.asBlack.winRate)}>
                      {opening.asBlack.winRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Record</span>
                    <span>
                      <span className="text-green-500">{opening.asBlack.wins}</span>
                      {' / '}
                      <span className="text-red-500">{opening.asBlack.losses}</span>
                      {' / '}
                      <span className="text-gray-400">{opening.asBlack.draws}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
