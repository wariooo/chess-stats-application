'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ParsedGame } from '@/app/types/chess';
import { calculateRatingProgressionByTimeControl } from '@/lib/chess/analytics';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface RatingProgressionProps {
  games: ParsedGame[];
}

export function RatingProgression({ games }: RatingProgressionProps) {
  const [selectedTimeControl, setSelectedTimeControl] = useState<
    'all' | 'bullet' | 'blitz' | 'rapid' | 'daily'
  >('all');

  const progressionByTimeControl = calculateRatingProgressionByTimeControl(games);

  // Prepare data for chart
  let chartData: any[] = [];

  if (selectedTimeControl === 'all') {
    // Combine all time controls
    const allGames = [
      ...games.map((g) => ({ ...g, label: g.timeClass })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    chartData = allGames.map((game, index) => ({
      index,
      date: game.date.toLocaleDateString(),
      rating: game.playerRating,
      timeClass: game.timeClass,
    }));
  } else {
    const data = progressionByTimeControl[selectedTimeControl];
    chartData = data.map((point, index) => ({
      index,
      date: point.date.toLocaleDateString(),
      rating: point.rating,
    }));
  }

  // Calculate statistics
  const startRating = chartData[0]?.rating || 0;
  const endRating = chartData[chartData.length - 1]?.rating || 0;
  const ratingChange = endRating - startRating;
  const peakRating = Math.max(...chartData.map((d) => d.rating), 0);
  const lowestRating = Math.min(...chartData.map((d) => d.rating), Infinity);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rating Progression</CardTitle>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            variant={selectedTimeControl === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTimeControl('all')}
          >
            All
          </Button>
          <Button
            variant={selectedTimeControl === 'bullet' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTimeControl('bullet')}
            disabled={progressionByTimeControl.bullet.length === 0}
          >
            Bullet
          </Button>
          <Button
            variant={selectedTimeControl === 'blitz' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTimeControl('blitz')}
            disabled={progressionByTimeControl.blitz.length === 0}
          >
            Blitz
          </Button>
          <Button
            variant={selectedTimeControl === 'rapid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTimeControl('rapid')}
            disabled={progressionByTimeControl.rapid.length === 0}
          >
            Rapid
          </Button>
          <Button
            variant={selectedTimeControl === 'daily' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTimeControl('daily')}
            disabled={progressionByTimeControl.daily.length === 0}
          >
            Daily
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="text-sm text-muted-foreground">Start Rating</div>
            <div className="text-2xl font-bold">{startRating}</div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="text-sm text-muted-foreground">Current Rating</div>
            <div className="text-2xl font-bold">{endRating}</div>
          </div>
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
            <div className="text-sm text-muted-foreground">Peak Rating</div>
            <div className="text-2xl font-bold">{peakRating}</div>
          </div>
          <div className={`text-center p-3 rounded-lg ${
            ratingChange >= 0
              ? 'bg-green-50 dark:bg-green-950/20'
              : 'bg-red-50 dark:bg-red-950/20'
          }`}>
            <div className="text-sm text-muted-foreground">Change</div>
            <div className={`text-2xl font-bold ${
              ratingChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {ratingChange >= 0 ? '+' : ''}{ratingChange}
            </div>
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="index"
              tickFormatter={(value) => {
                // Show every Nth tick to avoid crowding
                const interval = Math.ceil(chartData.length / 10);
                return value % interval === 0 ? chartData[value]?.date || '' : '';
              }}
            />
            <YAxis
              domain={[
                Math.floor(lowestRating / 100) * 100 - 50,
                Math.ceil(peakRating / 100) * 100 + 50,
              ]}
            />
            <Tooltip
              formatter={(value: any) => [value, 'Rating']}
              labelFormatter={(value) => chartData[value]?.date || ''}
            />
            <Line
              type="monotone"
              dataKey="rating"
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Insight */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <p className="text-sm">
            <span className="font-semibold">💡 Insight:</span>{' '}
            {ratingChange > 100 ? (
              <>You've gained {ratingChange} rating points - great improvement! Keep up the consistent practice.</>
            ) : ratingChange > 0 ? (
              <>You've gained {ratingChange} rating points. Steady progress in the right direction!</>
            ) : ratingChange === 0 ? (
              <>Your rating has remained stable. Consider trying new openings or study materials to break through.</>
            ) : ratingChange > -100 ? (
              <>You've lost {Math.abs(ratingChange)} points recently. Review your recent games to identify patterns in losses.</>
            ) : (
              <>Significant rating drop ({ratingChange}). Consider taking a break, reviewing fundamentals, or analyzing your recent losses with an engine.</>
            )}
            {' '}Your peak was {peakRating}, showing you have the potential to reach that level again.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
