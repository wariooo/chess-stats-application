import { NextRequest, NextResponse } from 'next/server';
import { MonthlyGamesResponse } from '@/app/types/chess';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string; year: string; month: string }> }
) {
  const { username, year, month } = await params;

  // Validate inputs
  const sanitizedUsername = username.trim().toLowerCase();
  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10);

  if (!sanitizedUsername) {
    return NextResponse.json(
      { error: 'Username is required' },
      { status: 400 }
    );
  }

  if (isNaN(yearNum) || yearNum < 2007 || yearNum > new Date().getFullYear()) {
    return NextResponse.json(
      { error: 'Invalid year' },
      { status: 400 }
    );
  }

  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return NextResponse.json(
      { error: 'Invalid month (must be 1-12)' },
      { status: 400 }
    );
  }

  // Format month with leading zero if needed
  const formattedMonth = monthNum.toString().padStart(2, '0');

  try {
    const response = await fetch(
      `https://api.chess.com/pub/player/${sanitizedUsername}/games/${year}/${formattedMonth}`,
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
          { error: 'No games found for this period' },
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

    const data: MonthlyGamesResponse = await response.json();

    // Determine cache duration based on whether this is the current month
    const now = new Date();
    const isCurrentMonth =
      yearNum === now.getFullYear() && monthNum === now.getMonth() + 1;

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': isCurrentMonth
          ? // Current month: cache for 1 hour
            'public, s-maxage=3600, stale-while-revalidate=7200'
          : // Past months: cache for 24 hours (data won't change)
            'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error) {
    console.error('Error fetching monthly games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch games. Please try again.' },
      { status: 500 }
    );
  }
}
