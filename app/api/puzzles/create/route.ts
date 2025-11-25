import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { puzzles } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  try {
    const puzzle = await db.insert(puzzles).values({
      userId: user.id,
      gameId: body.gameId,
      fen: body.fen,
      sideToMove: body.sideToMove,
      solution: JSON.stringify(body.solution),
      solutionSan: JSON.stringify(body.solutionSan),
      themes: JSON.stringify(body.themes),
      difficulty: body.difficulty,
      moveNumber: body.moveNumber,
      playerFoundIt: body.playerFoundIt ? 1 : 0,
      explanation: JSON.stringify(body.explanation),
    }).returning();

    return NextResponse.json(puzzle[0]);
  } catch (error) {
    console.error('Error creating puzzle:', error);
    return NextResponse.json(
      { error: 'Failed to create puzzle' },
      { status: 500 }
    );
  }
}
