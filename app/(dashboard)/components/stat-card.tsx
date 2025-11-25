import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GameStats } from '@/app/types/chess';

interface StatCardProps {
  title: string;
  stats: GameStats;
  icon?: React.ReactNode;
}

export function StatCard({ title, stats, icon }: StatCardProps) {
  const totalGames = stats.record.win + stats.record.loss + stats.record.draw;
  const winPercentage = totalGames > 0
    ? ((stats.record.win / totalGames) * 100).toFixed(1)
    : '0.0';

  const lastPlayedDate = new Date(stats.last.date * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const bestRatingDate = new Date(stats.best.date * 1000).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Rating */}
        <div>
          <p className="text-sm text-muted-foreground">Current Rating</p>
          <p className="text-3xl font-bold">{stats.last.rating}</p>
          <p className="text-xs text-muted-foreground">Last played: {lastPlayedDate}</p>
        </div>

        {/* Best Rating */}
        <div>
          <p className="text-sm text-muted-foreground">Peak Rating</p>
          <p className="text-xl font-semibold">{stats.best.rating}</p>
          <p className="text-xs text-muted-foreground">{bestRatingDate}</p>
        </div>

        {/* Win/Loss/Draw Record */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Record</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-green-50 dark:bg-green-950 rounded-md p-2">
              <p className="text-xs text-muted-foreground">Wins</p>
              <p className="text-lg font-semibold text-green-700 dark:text-green-400">
                {stats.record.win}
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-950 rounded-md p-2">
              <p className="text-xs text-muted-foreground">Losses</p>
              <p className="text-lg font-semibold text-red-700 dark:text-red-400">
                {stats.record.loss}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-2">
              <p className="text-xs text-muted-foreground">Draws</p>
              <p className="text-lg font-semibold">
                {stats.record.draw}
              </p>
            </div>
          </div>
        </div>

        {/* Win Percentage */}
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Win Rate</p>
            <p className="text-xl font-bold">{winPercentage}%</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {totalGames} total games
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
