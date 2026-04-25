import { BoardGame, GameFilters } from "@/lib/types";

export const GAMES_PER_PAGE = 10;

export const DEFAULT_FILTERS: GameFilters = {
  query: "",
  minPrice: "",
  maxPrice: "",
  type: "",
  players: "",
  publisher: "",
  playTime: "",
};

function matchesPlayersFilter(game: BoardGame, players: string) {
  switch (players) {
    case "1":
      return game.min_players <= 1 && game.max_players >= 1;
    case "2":
      return game.min_players <= 2 && game.max_players >= 2;
    case "3-4":
      return game.min_players <= 4 && game.max_players >= 3;
    case "5-6":
      return game.min_players <= 6 && game.max_players >= 5;
    case "7+":
      return game.max_players >= 7;
    default:
      return true;
  }
}

function matchesPlayTimeFilter(game: BoardGame, playTime: string) {
  switch (playTime) {
    case "30":
      return game.avg_play_time_minutes <= 30;
    case "60":
      return game.avg_play_time_minutes <= 60;
    case "120":
      return game.avg_play_time_minutes <= 120;
    case "121+":
      return game.avg_play_time_minutes > 120;
    default:
      return true;
  }
}

export function filterBoardGames(games: BoardGame[], filters: GameFilters) {
  const normalizedQuery = filters.query.trim().toLowerCase();
  const minPrice = filters.minPrice === "" ? null : Number(filters.minPrice);
  const maxPrice = filters.maxPrice === "" ? null : Number(filters.maxPrice);

  return games.filter((game) => {
    const searchableText = `${game.title} ${game.description.join(" ")}`.toLowerCase();

    if (normalizedQuery && !searchableText.includes(normalizedQuery)) {
      return false;
    }

    if (minPrice !== null && game.price_pln < minPrice) {
      return false;
    }

    if (maxPrice !== null && game.price_pln > maxPrice) {
      return false;
    }

    if (filters.type && game.type !== filters.type) {
      return false;
    }

    if (filters.publisher && game.publisher !== filters.publisher) {
      return false;
    }

    if (!matchesPlayersFilter(game, filters.players)) {
      return false;
    }

    if (!matchesPlayTimeFilter(game, filters.playTime)) {
      return false;
    }

    return true;
  });
}

export function getTypes(games: BoardGame[]) {
  return [...new Set(games.map((game) => game.type).filter(Boolean))].sort();
}

export function getPublishers(games: BoardGame[]) {
  return [...new Set(games.map((game) => game.publisher).filter(Boolean))].sort();
}
