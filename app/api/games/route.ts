import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { chessGames } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const games = await db
      .select()
      .from(chessGames)
      .where(eq(chessGames.userId, user.id))
      .orderBy(desc(chessGames.playedAt))
      .limit(100);

    return NextResponse.json(games);
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    );
  }
}
