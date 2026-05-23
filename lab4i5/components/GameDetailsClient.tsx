"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useCart } from "@/components/CartProvider";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import {
  buyNow,
  deleteOwnGame,
  fetchGameById,
  placeBid,
  seedInitialGamesIfEmpty,
} from "@/lib/firestoreGames";
import { hasFirebaseConfig } from "@/lib/firebase";
import { BoardGame } from "@/lib/types";

type GameDetailsClientProps = {
  gameId: string;
};

export function GameDetailsClient({ gameId }: GameDetailsClientProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isInCart, addToCart, removeFromCart } = useCart();
  const [game, setGame] = useState<BoardGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [bidAmount, setBidAmount] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionPending, setActionPending] = useState(false);

  useEffect(() => {
    async function loadGame() {
      try {
        if (user) {
          await seedInitialGamesIfEmpty(user);
        }

        const selectedGame = await fetchGameById(gameId);
        setGame(selectedGame);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Nie udało się załadować szczegółów gry.",
        );
      } finally {
        setLoading(false);
      }
    }

    if (!hasFirebaseConfig || authLoading) {
      return;
    }

    void loadGame();
  }, [authLoading, gameId, user]);

  async function handleBuyNow() {
    if (!user || !game) {
      setActionError("Zaloguj się, aby kupić ofertę.");
      return;
    }

    try {
      setActionError("");
      setActionPending(true);
      const updatedGame = await buyNow(game.id, user);
      setGame(updatedGame);
    } catch (buyError) {
      setActionError(
        buyError instanceof Error ? buyError.message : "Nie udało się kupić gry.",
      );
    } finally {
      setActionPending(false);
    }
  }

  async function handleBidSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !game) {
      setActionError("Zaloguj się, aby licytować.");
      return;
    }

    const amount = Number(bidAmount);

    if (Number.isNaN(amount)) {
      setActionError("Podaj poprawną kwotę.");
      return;
    }

    try {
      setActionError("");
      setActionPending(true);
      const updatedGame = await placeBid(game.id, amount, user);
      setGame(updatedGame);
      setBidAmount("");
    } catch (bidError) {
      setActionError(
        bidError instanceof Error
          ? bidError.message
          : "Nie udało się złożyć oferty.",
      );
    } finally {
      setActionPending(false);
    }
  }

  async function handleDelete() {
    if (!user || !game) {
      return;
    }

    if (!window.confirm("Czy na pewno chcesz usunąć tę ofertę?")) {
      return;
    }

    try {
      setActionError("");
      setActionPending(true);
      await deleteOwnGame(game.id, user);
      router.push("/");
    } catch (deleteError) {
      setActionError(
        deleteError instanceof Error
          ? deleteError.message
          : "Nie udało się usunąć gry.",
      );
      setActionPending(false);
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

  if (!game) {
    return (
      <div className="status-box">
        <p>Nie znaleziono gry.</p>
      </div>
    );
  }

  const isOwner = user?.uid === game.sellerId;
  const currentAuctionPrice = game.currentBidPln ?? game.price_pln;
  const minimumBid = currentAuctionPrice + 1;
  const canUseCart = !game.isSold && !game.isAuction && !isOwner;
  const inCart = isInCart(game.id);

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
          <span>{game.isAuction ? "Licytacja" : "Kup teraz"}</span>
          <span>{game.isSold ? "Sprzedana" : "Dostępna"}</span>
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

        {game.isAuction ? (
          <div className="auction-meta">
            <p className="price">Aktualna cena: {currentAuctionPrice.toFixed(2)} zł</p>
            <p className="hint-text">Minimalna oferta: {minimumBid.toFixed(2)} zł</p>
          </div>
        ) : (
          <p className="price">{game.price_pln.toFixed(2)} zł</p>
        )}

        <div className="detail-actions">
          {isOwner ? (
            <>
              <Link href={`/games/${game.id}/edit`} className="button button--primary">
                Edytuj
              </Link>
              <button
                type="button"
                className="button button--light"
                disabled={actionPending}
                onClick={handleDelete}
              >
                Usuń
              </button>
            </>
          ) : game.isSold ? (
            <span className="button button--light">Oferta niedostępna</span>
          ) : game.isAuction ? (
            user ? (
              <form className="auction-form" onSubmit={handleBidSubmit}>
                <div className="form-group auction-field">
                  <label htmlFor="bid-amount" className="auction-label">
                    Twoja oferta
                  </label>
                  <input
                    id="bid-amount"
                    className="form-control auction-input"
                    type="number"
                    min={minimumBid.toFixed(2)}
                    step="0.01"
                    value={bidAmount}
                    onChange={(event) => setBidAmount(event.target.value)}
                  />
                  <p className="hint-text auction-help">
                    Podaj kwotę wyższą niż aktualna cena i kliknij &quot;Licytuj&quot;.
                  </p>
                </div>
                <button
                  type="submit"
                  className="button button--accent"
                  disabled={actionPending}
                >
                  {actionPending ? "Licytowanie..." : "Licytuj"}
                </button>
              </form>
            ) : (
              <Link href="/login" className="button button--secondary">
                Zaloguj się, aby licytować
              </Link>
            )
          ) : user ? (
            <>
              <button
                type="button"
                className="button button--accent"
                disabled={actionPending}
                onClick={handleBuyNow}
              >
                {actionPending ? "Kupowanie..." : "Kup teraz"}
              </button>
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
            </>
          ) : (
            <>
              <Link href="/login" className="button button--secondary">
                Zaloguj się, aby kupić
              </Link>
              {canUseCart ? (
                <button
                  type="button"
                  className="button button--light"
                  onClick={() =>
                    inCart ? removeFromCart(game.id) : addToCart(game.id)
                  }
                >
                  {inCart ? "Usuń z koszyka" : "Do koszyka"}
                </button>
              ) : null}
            </>
          )}
        </div>
        {game.isAuction ? (
          <p className="text-muted detail-note">Liczba ofert: {game.bidCount}</p>
        ) : null}
        {actionError ? <p className="error-text">{actionError}</p> : null}
      </section>
    </>
  );
}
