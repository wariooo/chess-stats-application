import { ChessStats } from '@/app/types/chess';
import { StatCard } from './stat-card';
import { Card, CardContent } from '@/components/ui/card';

interface StatsDisplayProps {
  stats: ChessStats;
  username: string;
}

export function StatsDisplay({ stats, username }: StatsDisplayProps) {
  const hasAnyStats = stats.chess_bullet || stats.chess_blitz || stats.chess_rapid;

  if (!hasAnyStats) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">
          No statistics found for {username}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          This player might not have played any rated games yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Player Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold capitalize">{username}</h2>
        <p className="text-sm text-muted-foreground">Chess.com Statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.chess_bullet && (
          <StatCard
            title="Bullet"
            stats={stats.chess_bullet}
            icon={<span className="text-xl">⚡</span>}
          />
        )}
        {stats.chess_blitz && (
          <StatCard
            title="Blitz"
            stats={stats.chess_blitz}
            icon={<span className="text-xl">⏱️</span>}
          />
        )}
        {stats.chess_rapid && (
          <StatCard
            title="Rapid"
            stats={stats.chess_rapid}
            icon={<span className="text-xl">🕐</span>}
          />
        )}
      </div>

      {/* Empty State for Missing Formats */}
      {(!stats.chess_bullet || !stats.chess_blitz || !stats.chess_rapid) && (
        <div className="text-center text-sm text-muted-foreground">
          {!stats.chess_bullet && !stats.chess_blitz && !stats.chess_rapid && (
            <p>No time control statistics available for this player.</p>
          )}
          {(!stats.chess_bullet || !stats.chess_blitz || !stats.chess_rapid) &&
            (stats.chess_bullet || stats.chess_blitz || stats.chess_rapid) && (
              <p>Some game formats have no games played yet.</p>
            )}
        </div>
      )}
    </div>
  );
}

export function StatsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded mx-auto animate-pulse" />
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded mx-auto mt-2 animate-pulse" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="h-full">
            <CardContent className="p-6 space-y-4">
              <div className="h-6 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
