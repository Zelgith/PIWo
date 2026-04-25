"use client";

import { useEffect, useMemo, useState } from "react";
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
import { seedGamesIfEmpty } from "@/lib/storage";
import { BoardGame, GameFilters } from "@/lib/types";

export function GameListClient() {
  const [games, setGames] = useState<BoardGame[]>([]);
  const [filters, setFilters] = useState<GameFilters>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadInitialGames() {
      try {
        const loadedGames = await seedGamesIfEmpty();

        if (!isActive) {
          return;
        }

        setGames(loadedGames);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Nie udało się załadować listy gier.",
        );
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadInitialGames();

    return () => {
      isActive = false;
    };
  }, []);

  const filteredGames = useMemo(() => filterBoardGames(games, filters), [games, filters]);
  const types = useMemo(() => getTypes(games), [games]);
  const publishers = useMemo(() => getPublishers(games), [games]);
  const totalPages = Math.max(1, Math.ceil(filteredGames.length / GAMES_PER_PAGE));
  const pageStart = (currentPage - 1) * GAMES_PER_PAGE;
  const currentGames = filteredGames.slice(pageStart, pageStart + GAMES_PER_PAGE);

  function handleFilterChange(name: keyof GameFilters, value: string) {
    setCurrentPage(1);
    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
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
          <p className="text-muted">Strona {currentPage}</p>
        </div>

        {currentGames.length > 0 ? (
          <>
            <div className="games-grid">
              {currentGames.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
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
