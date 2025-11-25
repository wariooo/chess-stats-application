'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useStockfish } from '@/lib/chess/use-stockfish';
import { analyzeGameForPuzzles } from '@/lib/chess/puzzle-detector';
import { generatePuzzleFromCandidate } from '@/lib/chess/puzzle-generator';
import { DEFAULT_PUZZLE_SETTINGS } from '@/lib/chess/types';

interface Game {
  id: number;
  white: string;
  black: string;
  result: string;
  playedAt: string;
  chesscomUrl: string;
  pgn: string;
  whiteElo: number;
  blackElo: number;
  timeControl: string;
}

export default function AnalyzePage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGames, setSelectedGames] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, puzzlesFound: 0 });
  const [error, setError] = useState<string | null>(null);

  const { engine, isLoading: engineLoading, error: engineError } = useStockfish();

  useEffect(() => {
    fetchGames();
  }, []);

  async function fetchGames() {
    try {
      const response = await fetch('/api/games');
      const data = await response.json();
      setGames(data);
    } catch (err) {
      console.error('Error fetching games:', err);
      setError('Failed to load games');
    } finally {
      setLoading(false);
    }
  }

  function toggleGame(gameId: number) {
    const newSelected = new Set(selectedGames);
    if (newSelected.has(gameId)) {
      newSelected.delete(gameId);
    } else {
      newSelected.add(gameId);
    }
    setSelectedGames(newSelected);
  }

  function selectAll() {
    setSelectedGames(new Set(games.map((g) => g.id)));
  }

  function deselectAll() {
    setSelectedGames(new Set());
  }

  async function startAnalysis() {
    if (!engine || selectedGames.size === 0) return;

    setAnalyzing(true);
    setError(null);
    setProgress({ current: 0, total: selectedGames.size, puzzlesFound: 0 });

    const selectedGamesList = games.filter((g) => selectedGames.has(g.id));
    let totalPuzzles = 0;

    try {
      for (let i = 0; i < selectedGamesList.length; i++) {
        const game = selectedGamesList[i];

        setProgress({ current: i, total: selectedGames.size, puzzlesFound: totalPuzzles });

        // Analyze game for puzzle candidates
        const candidates = await analyzeGameForPuzzles(
          {
            ...game,
            userId: 0, // Will be set by API
            playedAt: new Date(game.playedAt),
          },
          engine,
          DEFAULT_PUZZLE_SETTINGS
        );

        // Generate puzzles from top 3 candidates
        const topCandidates = candidates.slice(0, 3);

        for (const candidate of topCandidates) {
          const puzzle = await generatePuzzleFromCandidate(
            candidate,
            {
              ...game,
              userId: 0,
              playedAt: new Date(game.playedAt),
            },
            engine,
            0, // userId - will be set by server
            game.id
          );

          // Save puzzle to database
          await savePuzzle(puzzle);
          totalPuzzles++;
        }

        setProgress({ current: i + 1, total: selectedGames.size, puzzlesFound: totalPuzzles });
      }

      // Analysis complete!
      setTimeout(() => {
        router.push('/puzzles');
      }, 2000);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }

  async function savePuzzle(puzzle: any) {
    // Note: You'll need to create this API endpoint
    try {
      await fetch('/api/puzzles/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(puzzle),
      });
    } catch (err) {
      console.error('Error saving puzzle:', err);
    }
  }

  if (loading || engineLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (engineError) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="p-6 bg-red-50">
          <p className="text-red-600">
            Failed to load chess engine: {engineError}
          </p>
          <p className="text-sm text-red-500 mt-2">
            Please check your Stockfish configuration.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Analyze Games for Puzzles</h1>

        {games.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600 mb-4">No games imported yet</p>
            <Button
              onClick={() => router.push('/puzzles/import')}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Import Games
            </Button>
          </Card>
        ) : (
          <>
            <Card className="p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  Select Games ({selectedGames.size} selected)
                </h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAll}>
                    Deselect All
                  </Button>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {games.map((game) => (
                  <div
                    key={game.id}
                    className={`p-3 border rounded cursor-pointer transition-colors ${
                      selectedGames.has(game.id)
                        ? 'bg-orange-50 border-orange-300'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => toggleGame(game.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">
                          {game.white} vs {game.black}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(game.playedAt).toLocaleDateString()} •{' '}
                          {game.result}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedGames.has(game.id)}
                        onChange={() => {}}
                        className="w-5 h-5"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {analyzing ? (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Analyzing Games...</h3>
                <div className="space-y-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${(progress.current / progress.total) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    Game {progress.current} of {progress.total} •{' '}
                    {progress.puzzlesFound} puzzles found
                  </p>
                  <p className="text-xs text-gray-500">
                    This may take a few minutes. Please don't close this page.
                  </p>
                </div>
              </Card>
            ) : (
              <div>
                {error && (
                  <Card className="p-4 mb-4 bg-red-50 border-red-200">
                    <p className="text-red-600">{error}</p>
                  </Card>
                )}

                <Button
                  onClick={startAnalysis}
                  disabled={selectedGames.size === 0}
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  size="lg"
                >
                  Analyze {selectedGames.size} Game{selectedGames.size !== 1 ? 's' : ''}
                </Button>

                <p className="text-sm text-gray-600 mt-3 text-center">
                  Analysis uses Stockfish to find tactical positions in your games.
                  This runs in your browser and may take 1-2 minutes per game.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
