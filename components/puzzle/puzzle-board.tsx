'use client';

import { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

interface PuzzleBoardProps {
  fen: string;
  solution: string[];
  solutionSan: string[];
  sideToMove: 'white' | 'black';
  onSolve?: () => void;
  onWrongMove?: () => void;
}

export default function PuzzleBoard({
  fen,
  solution,
  solutionSan,
  sideToMove,
  onSolve,
  onWrongMove,
}: PuzzleBoardProps) {
  const [game, setGame] = useState(new Chess(fen));
  const [currentPosition, setCurrentPosition] = useState(fen);
  const [solutionIndex, setSolutionIndex] = useState(0);
  const [moveSquares, setMoveSquares] = useState<Record<string, any>>({});
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setGame(new Chess(fen));
    setCurrentPosition(fen);
    setSolutionIndex(0);
    setIsComplete(false);
    setMoveSquares({});
  }, [fen]);

  function onDrop(sourceSquare: string, targetSquare: string) {
    if (isComplete) return false;

    const expectedMove = solution[solutionIndex];
    const expectedFrom = expectedMove.substring(0, 2);
    const expectedTo = expectedMove.substring(2, 4);

    const gameCopy = new Chess(game.fen());

    // Check if this is the correct move
    if (sourceSquare === expectedFrom && targetSquare === expectedTo) {
      // Correct move!
      const promotion = expectedMove.length > 4 ? expectedMove[4] : undefined;
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion,
      });

      if (move) {
        // Highlight squares green
        setMoveSquares({
          [sourceSquare]: { backgroundColor: 'rgba(34, 197, 94, 0.5)' },
          [targetSquare]: { backgroundColor: 'rgba(34, 197, 94, 0.5)' },
        });

        setGame(gameCopy);
        setCurrentPosition(gameCopy.fen());

        // Check if puzzle is complete
        if (solutionIndex >= solution.length - 1) {
          setIsComplete(true);
          if (onSolve) {
            setTimeout(() => onSolve(), 500);
          }
          return true;
        }

        // Play opponent's response after a delay
        setTimeout(() => {
          playOpponentMove(solutionIndex + 1);
        }, 500);

        setSolutionIndex(solutionIndex + 2); // Skip opponent's move
        return true;
      }
    }

    // Wrong move
    setMoveSquares({
      [sourceSquare]: { backgroundColor: 'rgba(239, 68, 68, 0.5)' },
      [targetSquare]: { backgroundColor: 'rgba(239, 68, 68, 0.5)' },
    });

    if (onWrongMove) {
      onWrongMove();
    }

    // Reset highlights after a delay
    setTimeout(() => {
      setMoveSquares({});
    }, 500);

    return false;
  }

  function playOpponentMove(index: number) {
    if (index >= solution.length) return;

    const opponentMove = solution[index];
    const from = opponentMove.substring(0, 2);
    const to = opponentMove.substring(2, 4);
    const promotion = opponentMove.length > 4 ? opponentMove[4] : undefined;

    const gameCopy = new Chess(game.fen());
    const move = gameCopy.move({ from, to, promotion });

    if (move) {
      setGame(gameCopy);
      setCurrentPosition(gameCopy.fen());
      setMoveSquares({});
    }
  }

  return (
    <div className="relative">
      <Chessboard
        position={currentPosition}
        onPieceDrop={onDrop}
        boardOrientation={sideToMove}
        customSquareStyles={moveSquares}
        arePiecesDraggable={!isComplete}
      />

      {isComplete && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-2xl font-bold text-green-600 mb-2">
              Puzzle Solved! 🎉
            </h3>
            <p className="text-gray-600">Great job!</p>
          </div>
        </div>
      )}
    </div>
  );
}
