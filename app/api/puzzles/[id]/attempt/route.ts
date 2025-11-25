import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { puzzleAttempts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const puzzleId = parseInt(id);
  const body = await request.json();

  const { solved, attempts, hintsUsed, timeSpent } = body;

  try {
    // Check if attempt already exists
    const existingAttempt = await db
      .select()
      .from(puzzleAttempts)
      .where(
        and(
          eq(puzzleAttempts.puzzleId, puzzleId),
          eq(puzzleAttempts.userId, user.id)
        )
      )
      .limit(1);

    if (existingAttempt.length > 0) {
      // Update existing attempt
      await db
        .update(puzzleAttempts)
        .set({
          solved: solved ? 1 : 0,
          attempts,
          hintsUsed,
          timeSpent,
          attemptedAt: new Date(),
        })
        .where(
          and(
            eq(puzzleAttempts.puzzleId, puzzleId),
            eq(puzzleAttempts.userId, user.id)
          )
        );
    } else {
      // Insert new attempt
      await db.insert(puzzleAttempts).values({
        puzzleId,
        userId: user.id,
        solved: solved ? 1 : 0,
        attempts,
        hintsUsed,
        timeSpent,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording puzzle attempt:', error);
    return NextResponse.json(
      { error: 'Failed to record attempt' },
      { status: 500 }
    );
  }
}
