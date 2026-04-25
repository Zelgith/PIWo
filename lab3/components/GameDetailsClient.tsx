"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useState } from "react";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { seedGamesIfEmpty } from "@/lib/storage";
import { BoardGame } from "@/lib/types";

type GameDetailsClientProps = {
  gameId: number;
};

export function GameDetailsClient({ gameId }: GameDetailsClientProps) {
  const [game, setGame] = useState<BoardGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isActive = true;

    async function loadGame() {
      try {
        const games = await seedGamesIfEmpty();
        const selectedGame = games.find((item) => item.id === gameId) ?? null;

        if (!isActive) {
          return;
        }

        setGame(selectedGame);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Nie udało się załadować szczegółów gry.",
        );
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadGame();

    return () => {
      isActive = false;
    };
  }, [gameId]);

  if (loading) {
    return <div className="status-box">Ładowanie szczegółów...</div>;
  }

  if (error) {
    return (
      <div className="status-box">
        <p>Nie udało się załadować szczegółów gry.</p>
        <p className="error-text">{error}</p>
      </div>
    );
  }

  if (!game || Number.isNaN(gameId)) {
    return (
      <div className="status-box">
        <p>Nie znaleziono gry.</p>
      </div>
    );
  }

  return (
    <>
      <div className="breadcrumb">
        <Link href="/">Powrót do listy gier</Link>
      </div>

      <section className="detail-card">
        <h1 className="page-title">{game.title}</h1>
        <div className="detail-meta">
          <span>{game.type}</span>
          <span>
            {game.min_players}-{game.max_players} graczy
          </span>
          <span>{game.avg_play_time_minutes} min</span>
          <span>{game.publisher}</span>
          <span>{game.is_expansion ? "Dodatek" : "Podstawka"}</span>
        </div>

        <div className="detail-gallery">
          {game.images.length > 0 ? (
            game.images.map((image, index) => (
              <div key={`${image}-${index}`} className="detail-gallery__item">
                {brokenImages[image] ? (
                  <ImagePlaceholder />
                ) : (
                  <img
                    className="detail-image"
                    src={image}
                    alt={`${game.title} ${index + 1}`}
                    onError={() =>
                      setBrokenImages((currentState) => ({
                        ...currentState,
                        [image]: true,
                      }))
                    }
                  />
                )}
              </div>
            ))
          ) : (
            <div className="detail-gallery__item">
              <ImagePlaceholder />
            </div>
          )}
        </div>

        <div className="detail-description">
          {game.description.map((paragraph, index) => (
            <p key={`${game.id}-${index}`}>{paragraph}</p>
          ))}
        </div>

        <p className="price">{game.price_pln.toFixed(2)} zł</p>

        <div className="detail-actions">
          <Link href={`/games/${game.id}/edit`} className="button button--primary">
            Edytuj
          </Link>
        </div>
      </section>
    </>
  );
}
