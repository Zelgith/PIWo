import { fetchBoardGames } from "@/lib/fetchBoardGames";
import { isResolvedImage, resolveBoardGameImage } from "@/lib/resolveBoardGameImage";
import { BoardGame } from "@/lib/types";

export const STORAGE_KEY = "lab3-board-games";

function isBrowser() {
  return typeof window !== "undefined";
}

function normalizeStoredGames(games: BoardGame[]) {
  return games.map((game) => ({
    ...game,
    images: game.images.map(resolveBoardGameImage).filter(isResolvedImage),
  }));
}

export function loadGames(): BoardGame[] {
  if (!isBrowser()) {
    return [];
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as BoardGame[];
    const games = Array.isArray(parsed) ? parsed : [];
    const normalizedGames = normalizeStoredGames(games);

    if (JSON.stringify(games) !== JSON.stringify(normalizedGames)) {
      saveGames(normalizedGames);
    }

    return normalizedGames;
  } catch {
    return [];
  }
}

export function saveGames(games: BoardGame[]) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

export async function seedGamesIfEmpty(): Promise<BoardGame[]> {
  const existingGames = loadGames();

  if (existingGames.length > 0) {
    return existingGames;
  }

  const fetchedGames = await fetchBoardGames();
  saveGames(fetchedGames);
  return fetchedGames;
}

export function getGameById(id: number) {
  return loadGames().find((game) => game.id === id);
}

export function addGame(newGame: Omit<BoardGame, "id">): BoardGame {
  const games = loadGames();
  const maxId = games.reduce((currentMax, game) => Math.max(currentMax, game.id), 0);
  const createdGame: BoardGame = {
    ...newGame,
    id: maxId + 1,
  };

  saveGames([...games, createdGame]);
  return createdGame;
}

export function updateGame(id: number, updatedValues: BoardGame): BoardGame | null {
  const games = loadGames();
  const gameIndex = games.findIndex((game) => game.id === id);

  if (gameIndex === -1) {
    return null;
  }

  const updatedGame: BoardGame = {
    ...updatedValues,
    id,
    auction: games[gameIndex].auction,
  };

  const nextGames = [...games];
  nextGames[gameIndex] = updatedGame;
  saveGames(nextGames);

  return updatedGame;
}
