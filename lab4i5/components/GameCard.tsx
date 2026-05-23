"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useCart } from "@/components/CartProvider";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { BoardGame } from "@/lib/types";

type GameCardProps = {
  game: BoardGame;
  buyingGameId: string | null;
  onBuyNow: (gameId: string) => void;
};

export function GameCard({ game, buyingGameId, onBuyNow }: GameCardProps) {
  const { user } = useAuth();
  const { isInCart, addToCart, removeFromCart } = useCart();
  const [hasImageError, setHasImageError] = useState(false);
  const firstImage = game.images[0];
  const shortDescription = game.description[0] ?? "Brak opisu.";
  const isOwner = user?.uid === game.sellerId;
  const isBuying = buyingGameId === game.id;
  const canUseCart = !game.isSold && !game.isAuction && !isOwner;
  const inCart = isInCart(game.id);

  return (
    <article className={`game-card${game.isSold ? " game-card--sold" : ""}`}>
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
        <div className="game-card__badges">
          {game.isAuction ? <span className="badge badge--auction">Licytacja</span> : null}
          {game.isSold ? <span className="badge badge--sold">Sprzedana</span> : null}
          {isOwner ? <span className="badge badge--owner">Twoja oferta</span> : null}
        </div>
        <Link href={`/games/${game.id}`} className="game-card__title">
          {game.title}
        </Link>
        <p className="game-card__info">
          {game.type} · {game.min_players}-{game.max_players} graczy ·{" "}
          {game.avg_play_time_minutes} min · {game.publisher}
        </p>
        <p className="game-card__desc">{shortDescription}</p>
        <div className="game-card__bottom">
          <span className="price game-card__price">
            {(game.isAuction ? game.currentBidPln ?? game.price_pln : game.price_pln).toFixed(2)} zł
          </span>
          <div className="game-card__actions">
            <Link href={`/games/${game.id}`} className="button button--light">
              Szczegóły
            </Link>
            {game.isSold ? (
              <span className="button button--light game-card__action-disabled">
                Niedostępna
              </span>
            ) : game.isAuction && isOwner ? null : game.isAuction ? (
              !user ? (
                <Link href="/login" className="button button--secondary">
                  Licytuj
                </Link>
              ) : (
              <Link href={`/games/${game.id}`} className="button button--secondary">
                Licytuj
              </Link>
              )
            ) : isOwner ? null : !user ? (
              <Link href="/login" className="button button--accent">
                Kup teraz
              </Link>
            ) : (
              <button
                type="button"
                className="button button--accent"
                disabled={isBuying}
                onClick={() => onBuyNow(game.id)}
              >
                {isBuying ? "Kupowanie..." : "Kup teraz"}
              </button>
            )}
            {canUseCart ? (
              <button
                type="button"
                className="button button--secondary"
                onClick={() =>
                  inCart ? removeFromCart(game.id) : addToCart(game.id)
                }
              >
                {inCart ? "Usuń z koszyka" : "Do koszyka"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
