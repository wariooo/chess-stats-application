'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChessStats, ChessApiError, isChessApiError, ParsedGame } from '@/app/types/chess';
import { useGameArchives, fetchPlayerGames } from '@/lib/chess/hooks';
import {
  calculateWinRate,
  calculateWinRateByColor,
} from '@/lib/chess/analytics';

interface PageProps {
  params: Promise<{ username: string }>;
}

export default function PlayerPage({ params }: PageProps) {
  const { username } = use(params);
  const [stats, setStats] = useState<ChessStats | null>(null);
  const [games, setGames] = useState<ParsedGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const { archives } = useGameArchives(username);

  // Fetch player stats and games
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch stats
        const statsResponse = await fetch(`/api/chess/${username.toLowerCase()}`);
        const statsData = await statsResponse.json();

        if (!statsResponse.ok || isChessApiError(statsData)) {
          setError(statsData.error || 'Failed to fetch player statistics');
          return;
        }
        setStats(statsData);

        // Fetch recent games (last 2 months)
        if (archives.length > 0) {
          const allGames: ParsedGame[] = [];
          const monthsToLoad = archives.slice(0, 2);

          for (const archiveUrl of monthsToLoad) {
            const match = archiveUrl.match(/\/(\d{4})\/(\d{2})$/);
            if (match) {
              const year = parseInt(match[1]);
              const month = parseInt(match[2]);
              try {
                const monthGames = await fetchPlayerGames(username, year, month);
                allGames.push(...monthGames);
              } catch (e) {
                console.error('Error fetching games:', e);
              }
            }
          }
          allGames.sort((a, b) => b.date.getTime() - a.date.getTime());
          setGames(allGames.slice(0, 50)); // Last 50 games
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [username, archives]);

  // Calculate analytics
  const winRateStats = calculateWinRate(games);
  const colorStats = calculateWinRateByColor(games);

  // Get opening stats from games
  const openingStats = games.reduce((acc, game) => {
    const opening = game.ecoCode || 'Unknown';
    if (!acc[opening]) {
      acc[opening] = { name: game.opening || opening, games: 0, wins: 0 };
    }
    acc[opening].games++;
    if (game.playerWon) acc[opening].wins++;
    return acc;
  }, {} as Record<string, { name: string; games: number; wins: number }>);

  const topOpenings = Object.entries(openingStats)
    .map(([code, data]) => ({
      code,
      name: data.name.split(':')[0].trim(),
      games: data.games,
      winRate: data.games > 0 ? (data.wins / data.games) * 100 : 0,
    }))
    .sort((a, b) => b.games - a.games)
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#2a2a2a]">
        <div className="w-64 bg-[#1e1e1e] p-6">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-gray-700 rounded-lg mb-4"></div>
            <div className="h-6 bg-gray-700 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-20"></div>
          </div>
        </div>
        <div className="flex-1 p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-700 rounded w-64"></div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-[#2a2a2a] items-center justify-center">
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
    );
  }

  const blitzRating = stats?.chess_blitz?.last.rating || 0;
  const rapidRating = stats?.chess_rapid?.last.rating || 0;

  return (
    <div className="flex min-h-screen bg-[#2a2a2a]">
      {/* Sidebar */}
      <div className="w-64 bg-[#1e1e1e] p-6 flex flex-col">
        {/* Player Info */}
        <div className="mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg mb-4 flex items-center justify-center text-white text-2xl font-bold">
            {username.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-white text-xl font-semibold capitalize">{username}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-gray-400 text-sm">🏳️ Global</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2 flex-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeTab === 'overview'
                ? 'bg-[#2a2a2a] text-orange-500'
                : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
            }`}
          >
            <span className="text-lg">📊</span>
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('games')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeTab === 'games'
                ? 'bg-[#2a2a2a] text-orange-500'
                : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
            }`}
          >
            <span className="text-lg">🕐</span>
            <span>Recent Games</span>
          </button>

          <Link
            href={`/openings/${username}`}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-gray-400 hover:bg-[#2a2a2a] hover:text-white transition-colors"
          >
            <span className="text-lg">📖</span>
            <span>Openings</span>
          </Link>

          <button
            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-left text-gray-400 hover:bg-[#2a2a2a] hover:text-white transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">🧩</span>
              <span>Mistakes & Puzzles</span>
            </div>
            <span className="bg-orange-500 text-white text-xs font-semibold px-2 py-0.5 rounded">PRO</span>
          </button>
        </nav>

        {/* Back Link */}
        <Link href="/" className="text-gray-500 hover:text-orange-500 text-sm mt-auto">
          ← Back to search
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Performance Summary</h1>
          <p className="text-gray-400 mt-1">Analysis based on your last <span className="text-white font-semibold">{games.length} games</span></p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {/* Blitz Rating */}
          <Card className="bg-[#1e1e1e] border-gray-800">
            <CardContent className="p-6">
              <p className="text-gray-400 text-sm mb-2">Blitz Rating</p>
              <p className="text-4xl font-bold text-white">{blitzRating}</p>
              {stats?.chess_blitz && (
                <p className="text-green-500 text-sm mt-2 flex items-center gap-1">
                  <span>📈</span> +12 this week
                </p>
              )}
            </CardContent>
          </Card>

          {/* Rapid Rating */}
          <Card className="bg-[#1e1e1e] border-gray-800">
            <CardContent className="p-6">
              <p className="text-gray-400 text-sm mb-2">Rapid Rating</p>
              <p className="text-4xl font-bold text-white">{rapidRating}</p>
            </CardContent>
          </Card>

          {/* Win Rate */}
          <Card className="bg-[#1e1e1e] border-gray-800">
            <CardContent className="p-6">
              <p className="text-gray-400 text-sm mb-2">Win Rate</p>
              <p className="text-4xl font-bold text-orange-500">{winRateStats.winRate.toFixed(0)}%</p>
              <div className="w-full bg-gray-700 rounded-full h-1.5 mt-3">
                <div
                  className="bg-orange-500 h-1.5 rounded-full"
                  style={{ width: `${winRateStats.winRate}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          {/* Accuracy */}
          <Card className="bg-[#1e1e1e] border-gray-800">
            <CardContent className="p-6">
              <p className="text-gray-400 text-sm mb-2">Accuracy (Avg)</p>
              <p className="text-4xl font-bold text-green-500">
                {games.filter(g => g.accuracy).length > 0
                  ? (games.reduce((sum, g) => sum + (g.accuracy || 0), 0) / games.filter(g => g.accuracy).length).toFixed(1)
                  : 'N/A'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Middle Section */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Play Style Analysis */}
          <Card className="bg-[#1e1e1e] border-gray-800 col-span-2">
            <CardContent className="p-6">
              <h3 className="text-white text-lg font-semibold mb-6 flex items-center gap-2">
                <span className="text-orange-500">◎</span> Play Style Analysis
              </h3>

              <div className="flex gap-8">
                {/* Aggression Circle */}
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#374151"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#f97316"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${(winRateStats.winRate / 100) * 352} 352`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-white">{Math.round(winRateStats.winRate)}</span>
                      <span className="text-xs text-gray-400">AGGRESSION</span>
                    </div>
                  </div>
                </div>

                {/* Analysis Text */}
                <div className="flex-1">
                  <h4 className="text-white text-xl font-semibold mb-2">
                    {winRateStats.winRate > 60 ? 'Universal Genius' : winRateStats.winRate > 50 ? 'Solid Player' : 'Learning Player'}
                  </h4>
                  <p className="text-gray-400 text-sm mb-6">
                    {winRateStats.winRate > 60
                      ? 'You have no clear weaknesses. You squeeze wins out of dry endgames and spot tactics instantly.'
                      : winRateStats.winRate > 50
                      ? 'You have a balanced playing style with room for improvement in specific areas.'
                      : 'Focus on fundamentals and pattern recognition to improve your game.'}
                  </p>

                  {/* Skill Bars */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Tactics</span>
                        <span className="text-green-500">Great</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Endgames</span>
                        <span className="text-orange-500">Needs Work</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{ width: '55%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Openings */}
          <Card className="bg-[#1e1e1e] border-gray-800">
            <CardContent className="p-6">
              <h3 className="text-white text-lg font-semibold mb-6 flex items-center gap-2">
                <span className="text-orange-500">📖</span> Key Openings
              </h3>

              <div className="space-y-4">
                {topOpenings.length > 0 ? topOpenings.map((opening, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-1">
                      <div>
                        <span className="text-white text-sm">{opening.name}</span>
                        <span className="text-gray-500 text-xs ml-2">{opening.games} games</span>
                      </div>
                      <span className="text-white font-semibold">{opening.winRate.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${opening.winRate}%` }}
                      ></div>
                    </div>
                  </div>
                )) : (
                  <p className="text-gray-500 text-sm">No opening data available</p>
                )}
              </div>

              <Link href={`/openings/${username}`}>
                <Button variant="outline" className="w-full mt-6 bg-transparent border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white">
                  View Full Opening Analysis
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Matches */}
        <Card className="bg-[#1e1e1e] border-gray-800">
          <CardContent className="p-6">
            <h3 className="text-white text-lg font-semibold mb-6">Recent Matches</h3>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 text-sm border-b border-gray-700">
                    <th className="text-left py-3 px-4">RESULT</th>
                    <th className="text-left py-3 px-4">OPPONENT</th>
                    <th className="text-left py-3 px-4">MOVES</th>
                    <th className="text-left py-3 px-4">ACCURACY</th>
                    <th className="text-left py-3 px-4">DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {games.slice(0, 5).map((game, index) => (
                    <tr key={index} className="border-b border-gray-800 hover:bg-[#2a2a2a]">
                      <td className="py-4 px-4">
                        <span className={`flex items-center gap-2 ${game.playerWon ? 'text-green-500' : game.playerLost ? 'text-red-500' : 'text-gray-400'}`}>
                          {game.playerWon ? '✓' : game.playerLost ? '✗' : '='} {game.playerWon ? 'Win' : game.playerLost ? 'Loss' : 'Draw'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-white">{game.opponentUsername}</td>
                      <td className="py-4 px-4 text-gray-400">{game.moveCount}</td>
                      <td className="py-4 px-4">
                        <span className={`${game.accuracy && game.accuracy > 80 ? 'text-green-500' : game.accuracy && game.accuracy > 60 ? 'text-orange-500' : 'text-red-500'}`}>
                          {game.accuracy ? `${game.accuracy.toFixed(0)}%` : '-'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-400">
                        {game.date.toLocaleDateString() === new Date().toLocaleDateString() ? 'Today' : game.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {games.length > 5 && (
              <div className="text-center mt-4">
                <Button variant="ghost" className="text-orange-500 hover:text-orange-400">
                  View All Games →
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
