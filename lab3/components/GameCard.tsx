"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useState } from "react";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { BoardGame } from "@/lib/types";

type GameCardProps = {
  game: BoardGame;
};

export function GameCard({ game }: GameCardProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const firstImage = game.images[0];
  const shortDescription = game.description[0] ?? "Brak opisu.";

  return (
    <article className="game-card">
      <div className="game-card__image">
        {firstImage && !hasImageError ? (
          <img
            className="card-image"
            src={firstImage}
            alt={game.title}
            onError={() => setHasImageError(true)}
          />
        ) : (
          <ImagePlaceholder />
        )}
      </div>
      <div className="game-card__content">
        <Link href={`/games/${game.id}`} className="game-card__title">
          {game.title}
        </Link>
        <p className="game-card__info">
          {game.type} · {game.min_players}-{game.max_players} graczy ·{" "}
          {game.avg_play_time_minutes} min · {game.publisher}
        </p>
        <p className="game-card__desc">{shortDescription}</p>
        <div className="game-card__bottom">
          <span className="price">{game.price_pln.toFixed(2)} zł</span>
          <Link href={`/games/${game.id}`} className="button button--secondary">
            Szczegóły
          </Link>
        </div>
      </div>
    </article>
  );
}
