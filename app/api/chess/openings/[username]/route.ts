import { NextRequest, NextResponse } from 'next/server';
import { MonthlyGamesResponse, ChessComGame } from '@/app/types/chess';
import { parseChessComGames } from '@/lib/chess/parser';
import { analyzeOpenings, OpeningStats } from '@/lib/chess/analytics';

interface ArchivesResponse {
  archives: string[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const searchParams = request.nextUrl.searchParams;

  // Get number of months from query params (default 3)
  const monthsToFetch = Math.min(parseInt(searchParams.get('months') || '3', 10), 12);
  // Get plies count from query params (default 8 = 4 full moves)
  const plies = parseInt(searchParams.get('plies') || '8', 10);
  // Optional time class filter
  const timeClass = searchParams.get('timeClass');

  const sanitizedUsername = username.trim().toLowerCase();

  if (!sanitizedUsername || sanitizedUsername.length === 0) {
    return NextResponse.json(
      { error: 'Username is required' },
      { status: 400 }
    );
  }

  try {
    // Step 1: Fetch archives list
    const archivesResponse = await fetch(
      `https://api.chess.com/pub/player/${sanitizedUsername}/games/archives`,
      {
        headers: {
          'User-Agent': 'ChessStatsApp/1.0 (chess-stats-app)',
          'Accept-Encoding': 'gzip',
        },
      }
    );

    if (!archivesResponse.ok) {
      if (archivesResponse.status === 404) {
        return NextResponse.json(
          { error: 'Player not found or has no archived games' },
          { status: 404 }
        );
      }
      throw new Error(`Chess.com API error: ${archivesResponse.status}`);
    }

    const archivesData: ArchivesResponse = await archivesResponse.json();

    // Get last N months (archives are sorted oldest to newest, so reverse)
    const recentArchives = [...archivesData.archives].reverse().slice(0, monthsToFetch);

    if (recentArchives.length === 0) {
      return NextResponse.json(
        { error: 'No game archives found' },
        { status: 404 }
      );
    }

    // Step 2: Fetch games from each month
    const allGames: ChessComGame[] = [];

    for (const archiveUrl of recentArchives) {
      try {
        const gamesResponse = await fetch(archiveUrl, {
          headers: {
            'User-Agent': 'ChessStatsApp/1.0 (chess-stats-app)',
            'Accept-Encoding': 'gzip',
          },
        });

        if (gamesResponse.ok) {
          const gamesData: MonthlyGamesResponse = await gamesResponse.json();
          allGames.push(...gamesData.games);
        }
      } catch (e) {
        console.error(`Error fetching ${archiveUrl}:`, e);
        // Continue with other months even if one fails
      }
    }

    if (allGames.length === 0) {
      return NextResponse.json(
        { error: 'No games found in the selected period' },
        { status: 404 }
      );
    }

    // Step 3: Filter games where username matches (already handled by parseChessComGames)
    // Also filter by time class if specified
    let filteredGames = allGames;
    if (timeClass) {
      filteredGames = allGames.filter(g => g.time_class === timeClass);
    }

    // Step 4: Parse games to get move history
    const parsedGames = parseChessComGames(filteredGames, sanitizedUsername);

    // Step 5: Analyze openings
    const openingStats = analyzeOpenings(parsedGames, plies);

    // Calculate summary statistics
    const totalGamesAnalyzed = parsedGames.length;
    const uniqueOpenings = openingStats.length;
    const gamesWithOpenings = openingStats.reduce((sum, o) => sum + o.gamesCount, 0);

    // Get date range
    const sortedGames = [...parsedGames].sort((a, b) => a.date.getTime() - b.date.getTime());
    const oldestGame = sortedGames[0]?.date;
    const newestGame = sortedGames[sortedGames.length - 1]?.date;

    return NextResponse.json(
      {
        username: sanitizedUsername,
        summary: {
          totalGamesAnalyzed,
          gamesWithOpenings,
          uniqueOpenings,
          monthsAnalyzed: recentArchives.length,
          pliesUsed: plies,
          timeClass: timeClass || 'all',
          dateRange: {
            from: oldestGame?.toISOString() || null,
            to: newestGame?.toISOString() || null,
          },
        },
        openings: openingStats,
      },
      {
        headers: {
          // Cache for 1 hour since this is computationally intensive
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch (error) {
    console.error('Error analyzing openings:', error);
    return NextResponse.json(
      { error: 'Failed to analyze openings. Please try again.' },
      { status: 500 }
    );
  }
}
