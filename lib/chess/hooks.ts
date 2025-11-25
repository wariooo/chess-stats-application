'use client';

import useSWR from 'swr';
import {
  ArchivesResponse,
  MonthlyGamesResponse,
  ParsedGame,
  ChessComGame,
} from '@/app/types/chess';
import { parseChessComGames } from './parser';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Hook to fetch a player's game archives list
 */
export function useGameArchives(username: string | null) {
  const { data, error, isLoading } = useSWR<ArchivesResponse>(
    username ? `/api/chess/archives/${username}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 3600000, // 1 hour
    }
  );

  return {
    archives: data?.archives ?? [],
    isLoading,
    error,
  };
}

/**
 * Hook to fetch games for a specific month
 */
export function useMonthlyGames(
  username: string | null,
  year: number | null,
  month: number | null
) {
  const shouldFetch = username && year !== null && month !== null;

  const { data, error, isLoading } = useSWR<MonthlyGamesResponse>(
    shouldFetch ? `/api/chess/games/${username}/${year}/${month}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 3600000, // 1 hour
    }
  );

  // Parse games client-side
  const parsedGames = data?.games && username
    ? parseChessComGames(data.games, username)
    : [];

  return {
    games: parsedGames,
    rawGames: data?.games ?? [],
    gamesCount: data?.games?.length ?? 0,
    isLoading,
    error,
  };
}

/**
 * Hook to fetch games from the most recent month
 * For multiple months, use the fetchAllPlayerGames utility or fetch in sequence
 */
export function useRecentMonthGames(username: string | null) {
  const { archives, isLoading: archivesLoading } = useGameArchives(username);

  // Get the most recent month
  const latestArchive = archives[0];
  const match = latestArchive?.match(/\/(\d{4})\/(\d{2})$/);

  const year = match ? parseInt(match[1]) : null;
  const month = match ? parseInt(match[2]) : null;

  const {
    games,
    gamesCount,
    isLoading: gamesLoading,
    error,
  } = useMonthlyGames(username, year, month);

  return {
    games,
    gamesCount,
    isLoading: archivesLoading || gamesLoading,
    error,
  };
}

/**
 * Utility to manually fetch and parse games
 * Useful for server components or non-hook contexts
 */
export async function fetchPlayerGames(
  username: string,
  year: number,
  month: number
): Promise<ParsedGame[]> {
  const formattedMonth = month.toString().padStart(2, '0');
  const response = await fetch(
    `/api/chess/games/${username}/${year}/${formattedMonth}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch games: ${response.statusText}`);
  }

  const data: MonthlyGamesResponse = await response.json();
  return parseChessComGames(data.games, username);
}

/**
 * Utility to fetch all available games for a player
 * Warning: This can be slow for players with many games
 */
export async function fetchAllPlayerGames(
  username: string,
  onProgress?: (current: number, total: number) => void
): Promise<ParsedGame[]> {
  // Get archives list
  const archivesResponse = await fetch(`/api/chess/archives/${username}`);
  if (!archivesResponse.ok) {
    throw new Error(`Failed to fetch archives: ${archivesResponse.statusText}`);
  }

  const { archives }: ArchivesResponse = await archivesResponse.json();
  const allGames: ParsedGame[] = [];

  // Fetch each month sequentially to avoid rate limiting
  for (let i = 0; i < archives.length; i++) {
    const url = archives[i];
    const match = url.match(/\/(\d{4})\/(\d{2})$/);

    if (match) {
      const year = parseInt(match[1]);
      const month = parseInt(match[2]);

      try {
        const games = await fetchPlayerGames(username, year, month);
        allGames.push(...games);

        if (onProgress) {
          onProgress(i + 1, archives.length);
        }

        // Small delay to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to fetch games for ${year}/${month}:`, error);
      }
    }
  }

  return allGames.sort((a, b) => b.date.getTime() - a.date.getTime());
}
