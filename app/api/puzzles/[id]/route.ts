import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { puzzles, puzzleAttempts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const puzzleId = parseInt(id);

  try {
    const result = await db
      .select({
        puzzle: puzzles,
        attempt: puzzleAttempts,
      })
      .from(puzzles)
      .leftJoin(
        puzzleAttempts,
        and(
          eq(puzzles.id, puzzleAttempts.puzzleId),
          eq(puzzleAttempts.userId, user.id)
        )
      )
      .where(and(eq(puzzles.id, puzzleId), eq(puzzles.userId, user.id)))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: 'Puzzle not found' }, { status: 404 });
    }

    const puzzle = result[0].puzzle;
    const attempt = result[0].attempt;

    return NextResponse.json({
      ...puzzle,
      themes: JSON.parse(puzzle.themes),
      solution: JSON.parse(puzzle.solution),
      solutionSan: JSON.parse(puzzle.solutionSan),
      explanation: JSON.parse(puzzle.explanation),
      playerFoundIt: puzzle.playerFoundIt === 1,
      attempt: attempt
        ? {
            ...attempt,
            solved: attempt.solved === 1,
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching puzzle:', error);
    return NextResponse.json(
      { error: 'Failed to fetch puzzle' },
      { status: 500 }
    );
  }
}
