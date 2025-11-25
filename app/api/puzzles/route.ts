import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { puzzles, puzzleAttempts } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const difficulty = searchParams.get('difficulty');
  const theme = searchParams.get('theme');
  const status = searchParams.get('status'); // 'solved', 'unsolved', 'all'
  const playerFound = searchParams.get('playerFound'); // 'true', 'false', 'all'

  try {
    let query = db
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
      .where(eq(puzzles.userId, user.id))
      .orderBy(desc(puzzles.createdAt));

    const results = await query;

    // Filter results based on query params
    let filteredResults = results;

    if (difficulty) {
      filteredResults = filteredResults.filter(
        (r) => r.puzzle.difficulty === parseInt(difficulty)
      );
    }

    if (theme) {
      filteredResults = filteredResults.filter((r) => {
        const themes = JSON.parse(r.puzzle.themes);
        return themes.some((t: any) => t.id === theme);
      });
    }

    if (status === 'solved') {
      filteredResults = filteredResults.filter((r) => r.attempt?.solved === 1);
    } else if (status === 'unsolved') {
      filteredResults = filteredResults.filter((r) => !r.attempt?.solved);
    }

    if (playerFound === 'true') {
      filteredResults = filteredResults.filter(
        (r) => r.puzzle.playerFoundIt === 1
      );
    } else if (playerFound === 'false') {
      filteredResults = filteredResults.filter(
        (r) => r.puzzle.playerFoundIt === 0
      );
    }

    // Format response
    const formattedResults = filteredResults.map((r) => ({
      ...r.puzzle,
      themes: JSON.parse(r.puzzle.themes),
      solution: JSON.parse(r.puzzle.solution),
      solutionSan: JSON.parse(r.puzzle.solutionSan),
      explanation: JSON.parse(r.puzzle.explanation),
      playerFoundIt: r.puzzle.playerFoundIt === 1,
      attempt: r.attempt
        ? {
            ...r.attempt,
            solved: r.attempt.solved === 1,
          }
        : null,
    }));

    return NextResponse.json(formattedResults);
  } catch (error) {
    console.error('Error fetching puzzles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch puzzles' },
      { status: 500 }
    );
  }
}
