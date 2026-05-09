"use client";

import {
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/components/AuthProvider";
import { FiltersPanel } from "@/components/FiltersPanel";
import { GameCard } from "@/components/GameCard";
import { Pagination } from "@/components/Pagination";
import {
  DEFAULT_FILTERS,
  filterBoardGames,
  GAMES_PER_PAGE,
  getPublishers,
  getTypes,
} from "@/lib/filterBoardGames";
import {
  buyNow,
  fetchGamesPage,
  seedInitialGamesIfEmpty,
} from "@/lib/firestoreGames";
import { hasFirebaseConfig } from "@/lib/firebase";
import { BoardGame, GameFilters } from "@/lib/types";

function mergeGames(currentGames: BoardGame[], nextGames: BoardGame[]) {
  const gameMap = new Map(currentGames.map((game) => [game.id, game]));

  nextGames.forEach((game) => {
    gameMap.set(game.id, game);
  });

  return [...gameMap.values()].sort((firstGame, secondGame) => {
    const firstTime = firstGame.createdAt?.toMillis() ?? 0;
    const secondTime = secondGame.createdAt?.toMillis() ?? 0;

    return secondTime - firstTime;
  });
}

export function GameListClient() {
  const { user, loading: authLoading } = useAuth();
  const [games, setGames] = useState<BoardGame[]>([]);
  const [filters, setFilters] = useState<GameFilters>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<Awaited<
    ReturnType<typeof fetchGamesPage>
  >["lastVisible"]>(null);
  const [buyingGameId, setBuyingGameId] = useState<string | null>(null);
  const gamesRef = useRef<BoardGame[]>([]);
  const hasMoreRef = useRef(false);
  const lastVisibleRef = useRef<Awaited<
    ReturnType<typeof fetchGamesPage>
  >["lastVisible"]>(null);

  useEffect(() => {
    gamesRef.current = games;
  }, [games]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    lastVisibleRef.current = lastVisible;
  }, [lastVisible]);

  const initializeGames = useEffectEvent(async () => {
    try {
      setLoading(true);
      setError("");
      setGames([]);
      setHasMore(false);
      setLastVisible(null);

      if (user) {
        await seedInitialGamesIfEmpty(user);
      }

      const page = await fetchGamesPage();

      setGames(page.games);
      setHasMore(page.hasMore);
      setLastVisible(page.lastVisible);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Nie udało się załadować listy gier.",
      );
    } finally {
      setLoading(false);
    }
  });

  const hydrateGamesForPage = useEffectEvent(
    async (targetPage: number, targetFilters: GameFilters) => {
      let nextGames = gamesRef.current;
      let nextCursor = lastVisibleRef.current;
      let nextHasMore = hasMoreRef.current;
      let filteredGames = filterBoardGames(nextGames, targetFilters);

      while (filteredGames.length < targetPage * GAMES_PER_PAGE && nextHasMore) {
        try {
          const page = await fetchGamesPage(nextCursor);
          nextGames = mergeGames(nextGames, page.games);
          nextCursor = page.lastVisible;
          nextHasMore = page.hasMore;
          filteredGames = filterBoardGames(nextGames, targetFilters);
        } catch (loadError) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Nie udało się pobrać kolejnej strony danych.",
          );
          break;
        }
      }

      if (nextGames !== gamesRef.current) {
        setGames(nextGames);
      }

      setLastVisible(nextCursor);
      setHasMore(nextHasMore);
    },
  );

  useEffect(() => {
    if (!hasFirebaseConfig || authLoading) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void initializeGames();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [authLoading, user?.uid]);

  const filteredGames = useMemo(() => filterBoardGames(games, filters), [games, filters]);
  const types = useMemo(() => getTypes(games), [games]);
  const publishers = useMemo(() => getPublishers(games), [games]);
  const totalPages = Math.max(1, Math.ceil(filteredGames.length / GAMES_PER_PAGE));
  const displayPage = Math.min(currentPage, totalPages);
  const pageStart = (displayPage - 1) * GAMES_PER_PAGE;
  const currentGames = filteredGames.slice(pageStart, pageStart + GAMES_PER_PAGE);

  useEffect(() => {
    if (loading || error) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void hydrateGamesForPage(currentPage, filters);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [currentPage, error, filters, loading]);

  function handleFilterChange(name: keyof GameFilters, value: string) {
    setCurrentPage(1);
    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  }

  async function handleBuyNow(gameId: string) {
    if (!user) {
      setError("Zaloguj się, aby kupić ofertę.");
      return;
    }

    try {
      setError("");
      setBuyingGameId(gameId);
      const updatedGame = await buyNow(gameId, user);
      setGames((currentGamesState) =>
        currentGamesState.map((game) =>
          game.id === updatedGame.id ? updatedGame : game,
        ),
      );
    } catch (buyError) {
      setError(
        buyError instanceof Error
          ? buyError.message
          : "Nie udało się kupić gry.",
      );
    } finally {
      setBuyingGameId(null);
    }
  }

  if (!hasFirebaseConfig) {
    return (
      <div className="status-box">
        <p>Brak konfiguracji Firebase.</p>
        <p className="error-text">
          Uzupełnij plik <code>.env.local</code> w folderze <code>lab4</code>.
        </p>
      </div>
    );
  }

  if (loading) {
    return <div className="status-box">Ładowanie gier...</div>;
  }

  if (error) {
    return (
      <div className="status-box">
        <p>Nie udało się załadować danych.</p>
        <p className="error-text">{error}</p>
      </div>
    );
  }

  return (
    <>
      <FiltersPanel
        filters={filters}
        types={types}
        publishers={publishers}
        onChange={handleFilterChange}
      />

      <section>
        <div className="games-header">
          <h2 className="section-title">Wyniki ({filteredGames.length})</h2>
          <p className="text-muted">Strona {displayPage}</p>
        </div>

        {currentGames.length > 0 ? (
          <>
            <div className="games-grid">
              {currentGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  buyingGameId={buyingGameId}
                  onBuyNow={handleBuyNow}
                />
              ))}
            </div>
            <Pagination
              currentPage={displayPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <div className="status-box">Brak wyników.</div>
        )}
      </section>
    </>
  );
}
