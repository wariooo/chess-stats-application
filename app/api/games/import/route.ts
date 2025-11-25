import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { chessGames } from '@/lib/db/schema';
import { Chess } from 'chess.js';

interface ChessComGame {
  url: string;
  pgn: string;
  white: {
    username: string;
    rating: number;
  };
  black: {
    username: string;
    rating: number;
  };
  end_time: number;
  time_control: string;
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { username, year, month } = body;

  if (!username || !year || !month) {
    return NextResponse.json(
      { error: 'Username, year, and month are required' },
      { status: 400 }
    );
  }

  try {
    // Fetch games from chess.com
    const response = await fetch(
      `https://api.chess.com/pub/player/${username}/games/${year}/${month}`,
      {
        headers: {
          'User-Agent': 'ChessStatsApp/1.0 (chess-stats-app)',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch games from chess.com');
    }

    const data = await response.json();
    const games: ChessComGame[] = data.games || [];

    // Parse and import games
    const importedGames = [];

    for (const game of games) {
      try {
        // Parse PGN to get result
        const chess = new Chess();
        chess.loadPgn(game.pgn);

        const history = chess.history();
        let result = '1/2-1/2';

        // Extract result from PGN headers
        const resultMatch = game.pgn.match(/\[Result "([^"]+)"\]/);
        if (resultMatch) {
          result = resultMatch[1];
        }

        // Insert into database
        const insertedGame = await db.insert(chessGames).values({
          userId: user.id,
          chesscomUrl: game.url,
          white: game.white.username,
          black: game.black.username,
          whiteElo: game.white.rating,
          blackElo: game.black.rating,
          result,
          timeControl: game.time_control,
          pgn: game.pgn,
          playedAt: new Date(game.end_time * 1000),
        }).returning();

        importedGames.push(insertedGame[0]);
      } catch (error) {
        console.error('Error importing game:', error);
        // Continue with next game
      }
    }

    return NextResponse.json({
      success: true,
      count: importedGames.length,
      games: importedGames,
    });
  } catch (error) {
    console.error('Error importing games:', error);
    return NextResponse.json(
      { error: 'Failed to import games' },
      { status: 500 }
    );
  }
}
