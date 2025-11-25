import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');
  const month = searchParams.get('month');

  const sanitizedUsername = username.trim().toLowerCase();

  if (!sanitizedUsername) {
    return NextResponse.json(
      { error: 'Username is required' },
      { status: 400 }
    );
  }

  try {
    // If year and month provided, fetch specific month
    if (year && month) {
      const response = await fetch(
        `https://api.chess.com/pub/player/${sanitizedUsername}/games/${year}/${month}`,
        {
          headers: {
            'User-Agent': 'ChessStatsApp/1.0 (chess-stats-app)',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return NextResponse.json(
            { error: 'Games not found for this period' },
            { status: 404 }
          );
        }
        throw new Error(`Chess.com API error: ${response.status}`);
      }

      const data = await response.json();
      return NextResponse.json(data);
    }

    // Otherwise, fetch archives list
    const response = await fetch(
      `https://api.chess.com/pub/player/${sanitizedUsername}/games/archives`,
      {
        headers: {
          'User-Agent': 'ChessStatsApp/1.0 (chess-stats-app)',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Player not found' },
          { status: 404 }
        );
      }
      throw new Error(`Chess.com API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching chess games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    );
  }
}
