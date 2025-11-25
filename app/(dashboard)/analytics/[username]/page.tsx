'use client';

import { use, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useGameArchives } from '@/lib/chess/hooks';
import { fetchPlayerGames } from '@/lib/chess/hooks';
import { ParsedGame } from '@/app/types/chess';
import { WinRateAnalysis } from '@/app/(dashboard)/components/analytics/win-rate-analysis';
import { RatingProgression } from '@/app/(dashboard)/components/analytics/rating-progression';
import { RecentFormStreaks } from '@/app/(dashboard)/components/analytics/recent-form-streaks';
import { StatsLoadingSkeleton } from '@/app/(dashboard)/components/stats-display';
import { ErrorMessage } from '@/app/(dashboard)/components/error-message';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ username: string }>;
}

export default function AnalyticsPage({ params }: PageProps) {
  const { username } = use(params);
  const [monthsToFetch, setMonthsToFetch] = useState(3);
  const [games, setGames] = useState<ParsedGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { archives, isLoading: archivesLoading } = useGameArchives(username);

  useEffect(() => {
    async function loadGames() {
      if (!username || archivesLoading || archives.length === 0) return;

      setIsLoading(true);
      setError(null);

      try {
        const allGames: ParsedGame[] = [];
        const monthsToLoad = archives.slice(0, monthsToFetch);

        for (const archiveUrl of monthsToLoad) {
          const match = archiveUrl.match(/\/(\d{4})\/(\d{2})$/);
          if (match) {
            const year = parseInt(match[1]);
            const month = parseInt(match[2]);
            const monthGames = await fetchPlayerGames(username, year, month);
            allGames.push(...monthGames);
          }
        }

        // Sort by date descending
        allGames.sort((a, b) => b.date.getTime() - a.date.getTime());
        setGames(allGames);
      } catch (err) {
        setError('Failed to load games');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    loadGames();
  }, [username, monthsToFetch, archives, archivesLoading]);

  const gamesCount = games.length;

  if (isLoading || archivesLoading) {
    return (
      <main className="min-h-screen bg-[#3d3d3d]">
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <Link href={`/player/${username}`} className="text-orange-500 hover:underline">
                &larr; Back to {username}
              </Link>
            </div>
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-600 rounded w-48"></div>
              <div className="h-64 bg-gray-600 rounded"></div>
              <div className="h-64 bg-gray-600 rounded"></div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#3d3d3d]">
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <Link href={`/player/${username}`} className="text-orange-500 hover:underline">
                &larr; Back to {username}
              </Link>
            </div>
            <ErrorMessage
              message="Failed to load analytics"
              suggestion="Please check the username and try again."
            />
          </div>
        </section>
      </main>
    );
  }

  if (games.length === 0) {
    return (
      <main className="min-h-screen bg-[#3d3d3d]">
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <Link href={`/player/${username}`} className="text-orange-500 hover:underline">
                &larr; Back to {username}
              </Link>
            </div>
            <div className="text-center py-12">
              <p className="text-lg text-white">
                No games found for {username}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Try loading more months or check if the username is correct.
              </p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#3d3d3d]">
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link href={`/player/${username}`} className="text-orange-500 hover:underline mb-4 inline-block">
              &larr; Back to {username}
            </Link>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white capitalize">{username}</h1>
                <p className="text-gray-400 mt-1">
                  Performance Analytics - {gamesCount} games analyzed
                </p>
              </div>

              {/* Load More Button */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">
                  Showing last {monthsToFetch} months
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMonthsToFetch((m) => Math.min(m + 3, 12))}
                  disabled={monthsToFetch >= 12}
                  className="bg-transparent border-gray-500 text-white hover:bg-gray-700"
                >
                  Load More
                </Button>
              </div>
            </div>
          </div>

          {/* Analytics Sections */}
          <div className="space-y-8">
            {/* Rating Progression */}
            <RatingProgression games={games} />

            {/* Win Rate Analysis */}
            <WinRateAnalysis games={games} />

            {/* Recent Form & Streaks */}
            <RecentFormStreaks games={games} />
          </div>

          {/* Footer */}
          <div className="mt-12 text-center text-sm text-muted-foreground">
            <p>
              Data refreshed from Chess.com • Showing games from last {monthsToFetch} months
            </p>
            <p className="mt-2">
              Want to see more? Load additional months or check back later for updated stats.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
