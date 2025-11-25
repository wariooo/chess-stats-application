'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Puzzle {
  id: number;
  fen: string;
  difficulty: number;
  themes: Array<{ name: string; category: string }>;
  sideToMove: string;
  playerFoundIt: boolean;
  attempt: any;
}

export default function PuzzlesPage() {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDifficulty, setFilterDifficulty] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchPuzzles();
  }, [filterDifficulty, filterStatus]);

  async function fetchPuzzles() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDifficulty) params.append('difficulty', filterDifficulty.toString());
      if (filterStatus !== 'all') params.append('status', filterStatus);

      const response = await fetch(`/api/puzzles?${params}`);
      const data = await response.json();
      setPuzzles(data);
    } catch (error) {
      console.error('Error fetching puzzles:', error);
    } finally {
      setLoading(false);
    }
  }

  const getDifficultyColor = (difficulty: number) => {
    const colors = ['green', 'lime', 'yellow', 'orange', 'red'];
    return colors[difficulty - 1] || 'gray';
  };

  const getDifficultyLabel = (difficulty: number) => {
    const labels = ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert'];
    return labels[difficulty - 1] || 'Unknown';
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Your Puzzles</h1>
        <p className="text-gray-600">
          Solve puzzles generated from your own games
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4 flex-wrap">
        <div>
          <label className="block text-sm font-medium mb-2">Difficulty</label>
          <select
            value={filterDifficulty || ''}
            onChange={(e) =>
              setFilterDifficulty(e.target.value ? parseInt(e.target.value) : null)
            }
            className="px-3 py-2 border rounded-md"
          >
            <option value="">All</option>
            <option value="1">Beginner</option>
            <option value="2">Easy</option>
            <option value="3">Medium</option>
            <option value="4">Hard</option>
            <option value="5">Expert</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All</option>
            <option value="unsolved">Unsolved</option>
            <option value="solved">Solved</option>
          </select>
        </div>
      </div>

      {/* Puzzles Grid */}
      {loading ? (
        <div className="text-center py-12">Loading puzzles...</div>
      ) : puzzles.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-4">No puzzles found</p>
          <Link href="/puzzles/import">
            <Button className="bg-orange-500 hover:bg-orange-600">
              Import Games to Generate Puzzles
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {puzzles.map((puzzle) => (
            <Link key={puzzle.id} href={`/puzzles/${puzzle.id}`}>
              <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex justify-between items-start mb-3">
                  <span
                    className={`px-2 py-1 rounded text-sm font-medium text-white bg-${getDifficultyColor(
                      puzzle.difficulty
                    )}-500`}
                  >
                    {getDifficultyLabel(puzzle.difficulty)}
                  </span>
                  {puzzle.attempt?.solved && (
                    <span className="text-green-600 font-medium">✓ Solved</span>
                  )}
                </div>

                <div className="aspect-square bg-gray-100 rounded mb-3">
                  {/* Placeholder for board preview - you can add a static board image here */}
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    {puzzle.sideToMove === 'white' ? '♔' : '♚'} to move
                  </div>
                </div>

                <div className="flex gap-1 flex-wrap">
                  {puzzle.themes.slice(0, 2).map((theme, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                    >
                      {theme.name}
                    </span>
                  ))}
                  {puzzle.themes.length > 2 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      +{puzzle.themes.length - 2}
                    </span>
                  )}
                </div>

                {puzzle.playerFoundIt && (
                  <p className="text-xs text-green-600 mt-2">
                    ✓ You found this move in your game!
                  </p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
