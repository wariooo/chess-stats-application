import { NextRequest, NextResponse } from 'next/server';
import { ArchivesResponse } from '@/app/types/chess';

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
      `https://api.chess.com/pub/player/${sanitizedUsername}/games/archives`,
      {
        headers: {
          'User-Agent': 'ChessStatsApp/1.0 (chess-stats-app)',
          'Accept-Encoding': 'gzip',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Player not found or has no archived games' },
          { status: 404 }
        );
      }

      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait and try again.' },
          { status: 429 }
        );
      }

      throw new Error(`Chess.com API error: ${response.status}`);
    }

    const data: ArchivesResponse = await response.json();

    // Sort archives chronologically (most recent first)
    const sortedArchives = [...data.archives].reverse();

    return NextResponse.json(
      { archives: sortedArchives },
      {
        headers: {
          // Cache for 12 hours - archives list doesn't change often
          'Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching game archives:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game archives. Please try again.' },
      { status: 500 }
    );
  }
}
