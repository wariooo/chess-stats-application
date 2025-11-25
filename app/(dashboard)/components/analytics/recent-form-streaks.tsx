'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ParsedGame } from '@/app/types/chess';
import {
  calculateRecentForm,
  detectStreaks,
  calculatePersonalRecords,
} from '@/lib/chess/analytics';

interface RecentFormStreaksProps {
  games: ParsedGame[];
}

export function RecentFormStreaks({ games }: RecentFormStreaksProps) {
  const recentForm = calculateRecentForm(games, 20);
  const { currentStreak, longestWinStreak, longestLossStreak } = detectStreaks(games);
  const records = calculatePersonalRecords(games);

  return (
    <div className="space-y-6">
      {/* Recent Form */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Form (Last 20 Games)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Statistics */}
            <div className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Win Rate</div>
                <div className="text-3xl font-bold">{recentForm.winRate.toFixed(1)}%</div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wins:</span>
                <span className="font-semibold text-green-600">{recentForm.wins}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Losses:</span>
                <span className="font-semibold text-red-600">{recentForm.losses}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Draws:</span>
                <span className="font-semibold">{recentForm.draws}</span>
              </div>
            </div>

            {/* Trend */}
            <div className="md:col-span-2">
              <div className="mb-4">
                <div className="text-sm text-muted-foreground mb-2">Form Trend</div>
                <div className="flex items-center gap-3">
                  {recentForm.trend === 'improving' && (
                    <>
                      <span className="text-4xl">📈</span>
                      <div>
                        <div className="text-xl font-bold text-green-600">Improving</div>
                        <div className="text-sm text-muted-foreground">
                          +{recentForm.comparison.toFixed(1)}% vs overall
                        </div>
                      </div>
                    </>
                  )}
                  {recentForm.trend === 'stable' && (
                    <>
                      <span className="text-4xl">📊</span>
                      <div>
                        <div className="text-xl font-bold">Stable</div>
                        <div className="text-sm text-muted-foreground">
                          {recentForm.comparison >= 0 ? '+' : ''}{recentForm.comparison.toFixed(1)}% vs overall
                        </div>
                      </div>
                    </>
                  )}
                  {recentForm.trend === 'declining' && (
                    <>
                      <span className="text-4xl">📉</span>
                      <div>
                        <div className="text-xl font-bold text-red-600">Declining</div>
                        <div className="text-sm text-muted-foreground">
                          {recentForm.comparison.toFixed(1)}% vs overall
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Insight */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <p className="text-sm">
                  <span className="font-semibold">💡 Tip:</span>{' '}
                  {recentForm.trend === 'improving' ? (
                    <>You're on fire! Your recent form is excellent. Keep doing what you're doing.</>
                  ) : recentForm.trend === 'declining' ? (
                    <>Consider taking a short break or reviewing your recent losses. Sometimes stepping away helps regain focus.</>
                  ) : (
                    <>Your form is consistent. To improve further, try studying specific openings or tactical patterns.</>
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Streaks */}
      <Card>
        <CardHeader>
          <CardTitle>Streaks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Current Streak */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Current Streak</div>
              {currentStreak ? (
                <>
                  <div className="text-3xl mb-2">
                    {currentStreak.type === 'win' ? '🔥' : currentStreak.type === 'loss' ? '❄️' : '🤝'}
                  </div>
                  <div className="text-2xl font-bold">
                    {currentStreak.length} {currentStreak.type === 'win' ? 'Wins' : currentStreak.type === 'loss' ? 'Losses' : 'Draws'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Since {currentStreak.startDate.toLocaleDateString()}
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground">No active streak</div>
              )}
            </div>

            {/* Longest Win Streak */}
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Longest Win Streak</div>
              {longestWinStreak ? (
                <>
                  <div className="text-3xl mb-2">🏆</div>
                  <div className="text-2xl font-bold text-green-600">
                    {longestWinStreak.length} Wins
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {longestWinStreak.startDate.toLocaleDateString()} -{' '}
                    {longestWinStreak.endDate.toLocaleDateString()}
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground">No win streaks yet</div>
              )}
            </div>

            {/* Longest Loss Streak */}
            <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Longest Loss Streak</div>
              {longestLossStreak ? (
                <>
                  <div className="text-3xl mb-2">💔</div>
                  <div className="text-2xl font-bold text-red-600">
                    {longestLossStreak.length} Losses
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {longestLossStreak.startDate.toLocaleDateString()} -{' '}
                    {longestLossStreak.endDate.toLocaleDateString()}
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground">No loss streaks</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Records */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Highest Rating */}
            {records.highestRating && (
              <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">Highest Rating</div>
                <div className="text-3xl mb-2">⭐</div>
                <div className="text-2xl font-bold">{records.highestRating.rating}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {records.highestRating.timeClass} •{' '}
                  {records.highestRating.date.toLocaleDateString()}
                </div>
              </div>
            )}

            {/* Longest Game */}
            {records.longestGame && (
              <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">Longest Game</div>
                <div className="text-3xl mb-2">⏱️</div>
                <div className="text-2xl font-bold">{records.longestGame.moves} moves</div>
                <div className="text-xs text-muted-foreground mt-1">
                  vs {records.longestGame.opponent}
                </div>
                <a
                  href={records.longestGame.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline mt-1 block"
                >
                  View game →
                </a>
              </div>
            )}

            {/* Biggest Upset */}
            {records.biggestUpset && records.biggestUpset.ratingDifference > 0 && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">Biggest Upset</div>
                <div className="text-3xl mb-2">🎯</div>
                <div className="text-2xl font-bold">+{records.biggestUpset.ratingDifference}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Beat {records.biggestUpset.opponent} ({records.biggestUpset.opponentRating})
                </div>
                <a
                  href={records.biggestUpset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline mt-1 block"
                >
                  View game →
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
