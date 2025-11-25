'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PuzzleBoard from '@/components/puzzle/puzzle-board';

interface Puzzle {
  id: number;
  fen: string;
  sideToMove: 'white' | 'black';
  solution: string[];
  solutionSan: string[];
  themes: Array<{ id: string; name: string; category: string }>;
  difficulty: number;
  explanation: {
    context: string;
    keyIdea: string;
    continuation: string;
    alternatives: string;
  };
  source: {
    white: string;
    black: string;
    whiteElo: number;
    blackElo: number;
    result: string;
    url: string;
  };
  playerFoundIt: boolean;
  attempt: any;
}

export default function PuzzleSolvePage() {
  const params = useParams();
  const router = useRouter();
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [startTime] = useState(Date.now());
  const [showExplanation, setShowExplanation] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  useEffect(() => {
    fetchPuzzle();
  }, [params.id]);

  async function fetchPuzzle() {
    try {
      const response = await fetch(`/api/puzzles/${params.id}`);
      const data = await response.json();
      setPuzzle(data);
    } catch (error) {
      console.error('Error fetching puzzle:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSolve() {
    if (!puzzle) return;

    const timeSpent = Date.now() - startTime;

    try {
      await fetch(`/api/puzzles/${puzzle.id}/attempt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          solved: true,
          attempts: attempts + 1,
          hintsUsed,
          timeSpent,
        }),
      });

      setShowExplanation(true);
    } catch (error) {
      console.error('Error recording attempt:', error);
    }
  }

  function handleWrongMove() {
    setAttempts(attempts + 1);
  }

  function handleHint() {
    setHintsUsed(hintsUsed + 1);
    setShowSolution(true);
  }

  const getDifficultyColor = (difficulty: number) => {
    const colors = ['green', 'lime', 'yellow', 'orange', 'red'];
    return colors[difficulty - 1] || 'gray';
  };

  const getDifficultyLabel = (difficulty: number) => {
    const labels = ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert'];
    return labels[difficulty - 1] || 'Unknown';
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">Loading puzzle...</div>
      </div>
    );
  }

  if (!puzzle) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">Puzzle not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Board */}
        <div>
          <PuzzleBoard
            fen={puzzle.fen}
            solution={puzzle.solution}
            solutionSan={puzzle.solutionSan}
            sideToMove={puzzle.sideToMove}
            onSolve={handleSolve}
            onWrongMove={handleWrongMove}
          />

          {/* Controls */}
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={handleHint}
              disabled={showSolution}
            >
              Show Hint
            </Button>
            <Button variant="outline" onClick={() => router.push('/puzzles')}>
              Back to Puzzles
            </Button>
          </div>

          {showSolution && (
            <Card className="mt-4 p-4">
              <h3 className="font-semibold mb-2">Solution:</h3>
              <p className="text-sm">{puzzle.solutionSan.join(', ')}</p>
            </Card>
          )}
        </div>

        {/* Right: Info */}
        <div className="space-y-4">
          {/* Difficulty & Themes */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span
                className={`px-3 py-1 rounded text-sm font-medium text-white bg-${getDifficultyColor(
                  puzzle.difficulty
                )}-500`}
              >
                {getDifficultyLabel(puzzle.difficulty)}
              </span>
              <span className="text-sm text-gray-600">
                Attempts: {attempts}
              </span>
            </div>

            <div className="flex gap-2 flex-wrap">
              {puzzle.themes.map((theme) => (
                <span
                  key={theme.id}
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                >
                  {theme.name}
                </span>
              ))}
            </div>
          </Card>

          {/* Game Source */}
          <Card className="p-4">
            <h3 className="font-semibold mb-2">From your game:</h3>
            <p className="text-sm mb-1">
              <strong>{puzzle.source.white}</strong> ({puzzle.source.whiteElo})
              vs <strong>{puzzle.source.black}</strong> ({puzzle.source.blackElo}
              )
            </p>
            <p className="text-sm text-gray-600 mb-2">
              Result: {puzzle.source.result}
            </p>
            <a
              href={puzzle.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              View game on Chess.com →
            </a>
          </Card>

          {/* Player Performance */}
          {puzzle.playerFoundIt && (
            <Card className="p-4 bg-green-50 border-green-200">
              <p className="text-sm text-green-700">
                ✓ You found this move in your game!
              </p>
            </Card>
          )}

          {/* Explanation */}
          {showExplanation && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Explanation</h3>

              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Position:</h4>
                  <p className="text-gray-600">{puzzle.explanation.context}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Key Idea:</h4>
                  <p className="text-gray-600">{puzzle.explanation.keyIdea}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-1">
                    Continuation:
                  </h4>
                  <p className="text-gray-600">
                    {puzzle.explanation.continuation}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-1">
                    Alternatives:
                  </h4>
                  <p className="text-gray-600">
                    {puzzle.explanation.alternatives}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
