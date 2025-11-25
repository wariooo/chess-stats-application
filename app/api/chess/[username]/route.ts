import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  // Validate and sanitize username
  const sanitizedUsername = username.trim().toLowerCase();

  if (!sanitizedUsername || sanitizedUsername.length === 0) {
    return NextResponse.json(
      { error: 'Username is required' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://api.chess.com/pub/player/${sanitizedUsername}/stats`,
      {
        headers: {
          'User-Agent': 'ChessStatsApp/1.0 (chess-stats-app)',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Player not found. Please check the username.' },
          { status: 404 }
        );
      }

      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait a moment and try again.' },
          { status: 429 }
        );
      }

      throw new Error(`Chess.com API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('Error fetching chess stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player statistics. Please try again.' },
      { status: 500 }
    );
  }
}
