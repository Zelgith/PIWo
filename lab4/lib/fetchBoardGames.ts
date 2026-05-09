import {
  isResolvedImage,
  resolveBoardGameImage,
} from "@/lib/resolveBoardGameImage";
import { BoardGameSeed } from "@/lib/types";

const DATA_URL = "https://szandala.github.io/piwo-api/board-games.json";

type BoardGamesResponse = {
  board_games?: unknown[];
};

function normalizeBoardGame(
  game: Record<string, unknown>,
  index: number,
): BoardGameSeed {
  const rawImages = Array.isArray(game.images) ? game.images : [];
  const rawDescription = Array.isArray(game.description) ? game.description : [];

  return {
    legacyId: String(Number(game.id) || index + 1),
    title: typeof game.title === "string" ? game.title : "",
    images: rawImages.map(resolveBoardGameImage).filter(isResolvedImage),
    description: rawDescription
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean),
    min_players: Number(game.min_players) || 1,
    max_players: Number(game.max_players) || 1,
    avg_play_time_minutes: Number(game.avg_play_time_minutes) || 0,
    publisher: typeof game.publisher === "string" ? game.publisher : "",
    is_expansion: Boolean(game.is_expansion),
    price_pln: Number(game.price_pln) || 0,
    type: typeof game.type === "string" ? game.type : "",
    isAuction: Boolean(game.auction),
  };
}

export async function fetchBoardGames(): Promise<BoardGameSeed[]> {
  const response = await fetch(DATA_URL, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Nie udało się pobrać danych o grach.");
  }

  const data = (await response.json()) as BoardGamesResponse;
  const items = Array.isArray(data.board_games) ? data.board_games : [];

  return items
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null,
    )
    .map((item, index) => normalizeBoardGame(item, index))
    .filter((game) => game.title !== "");
}
