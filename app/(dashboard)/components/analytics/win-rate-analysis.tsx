'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ParsedGame } from '@/app/types/chess';
import {
  calculateWinRateByColor,
  calculateWinRateByTimeControl,
} from '@/lib/chess/analytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface WinRateAnalysisProps {
  games: ParsedGame[];
}

export function WinRateAnalysis({ games }: WinRateAnalysisProps) {
  const byColor = calculateWinRateByColor(games);
  const byTimeControl = calculateWinRateByTimeControl(games);

  // Prepare data for charts
  const colorData = [
    {
      name: 'White',
      'Win Rate': byColor.white.winRate,
      Wins: byColor.white.wins,
      Losses: byColor.white.losses,
      Draws: byColor.white.draws,
      Total: byColor.white.total,
    },
    {
      name: 'Black',
      'Win Rate': byColor.black.winRate,
      Wins: byColor.black.wins,
      Losses: byColor.black.losses,
      Draws: byColor.black.draws,
      Total: byColor.black.total,
    },
  ];

  const timeControlData = [
    {
      name: 'Bullet',
      'Win Rate': byTimeControl.bullet.winRate,
      Games: byTimeControl.bullet.total,
    },
    {
      name: 'Blitz',
      'Win Rate': byTimeControl.blitz.winRate,
      Games: byTimeControl.blitz.total,
    },
    {
      name: 'Rapid',
      'Win Rate': byTimeControl.rapid.winRate,
      Games: byTimeControl.rapid.total,
    },
    {
      name: 'Daily',
      'Win Rate': byTimeControl.daily.winRate,
      Games: byTimeControl.daily.total,
    },
  ].filter((tc) => tc.Games > 0); // Only show time controls with games

  return (
    <div className="space-y-6">
      {/* By Color */}
      <Card>
        <CardHeader>
          <CardTitle>Win Rate by Color</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* White Stats */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="text-2xl">⚪</span> Playing White
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Games:</span>
                  <span className="font-semibold">{byColor.white.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wins:</span>
                  <span className="font-semibold text-green-600">{byColor.white.wins}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Losses:</span>
                  <span className="font-semibold text-red-600">{byColor.white.losses}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Draws:</span>
                  <span className="font-semibold">{byColor.white.draws}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Win Rate:</span>
                  <span className="font-bold text-lg">{byColor.white.winRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Black Stats */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="text-2xl">⚫</span> Playing Black
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Games:</span>
                  <span className="font-semibold">{byColor.black.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wins:</span>
                  <span className="font-semibold text-green-600">{byColor.black.wins}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Losses:</span>
                  <span className="font-semibold text-red-600">{byColor.black.losses}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Draws:</span>
                  <span className="font-semibold">{byColor.black.draws}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Win Rate:</span>
                  <span className="font-bold text-lg">{byColor.black.winRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="mt-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={colorData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} label={{ value: 'Win Rate %', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  formatter={(value: any, name: string) => {
                    if (name === 'Win Rate') return [`${Number(value).toFixed(1)}%`, name];
                    return [value, name];
                  }}
                />
                <Bar dataKey="Win Rate" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Insight */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <p className="text-sm">
              <span className="font-semibold">💡 Insight:</span>{' '}
              {byColor.white.winRate > byColor.black.winRate + 5 ? (
                <>You perform significantly better with White pieces (+{(byColor.white.winRate - byColor.black.winRate).toFixed(1)}%). Consider studying Black openings to balance your play.</>
              ) : byColor.black.winRate > byColor.white.winRate + 5 ? (
                <>You perform significantly better with Black pieces (+{(byColor.black.winRate - byColor.white.winRate).toFixed(1)}%). This is unusual - review your White opening repertoire.</>
              ) : (
                <>Your performance is well-balanced between colors (difference: {Math.abs(byColor.white.winRate - byColor.black.winRate).toFixed(1)}%).</>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* By Time Control */}
      <Card>
        <CardHeader>
          <CardTitle>Win Rate by Time Control</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timeControlData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} label={{ value: 'Win Rate %', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                formatter={(value: any, name: string) => {
                  if (name === 'Win Rate') return [`${Number(value).toFixed(1)}%`, name];
                  return [value, name];
                }}
              />
              <Legend />
              <Bar dataKey="Win Rate" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {timeControlData.map((tc) => (
              <div key={tc.name} className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-sm text-muted-foreground">{tc.name}</div>
                <div className="text-2xl font-bold">{tc['Win Rate'].toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">{tc.Games} games</div>
              </div>
            ))}
          </div>

          {/* Insight */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <p className="text-sm">
              <span className="font-semibold">💡 Insight:</span>{' '}
              {timeControlData.length > 0 && (
                <>
                  Your strongest time control is{' '}
                  <span className="font-semibold">
                    {timeControlData.reduce((max, tc) => tc['Win Rate'] > max['Win Rate'] ? tc : max).name}
                  </span>{' '}
                  ({timeControlData.reduce((max, tc) => tc['Win Rate'] > max['Win Rate'] ? tc : max)['Win Rate'].toFixed(1)}%).
                  {timeControlData.length > 1 && (
                    <> Consider focusing training on {timeControlData.reduce((min, tc) => tc['Win Rate'] < min['Win Rate'] ? tc : min).name} to improve overall performance.</>
                  )}
                </>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
