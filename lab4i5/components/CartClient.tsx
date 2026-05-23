"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useCart } from "@/components/CartProvider";
import { buyNow, fetchGamesByIds } from "@/lib/firestoreGames";
import { hasFirebaseConfig } from "@/lib/firebase";
import { BoardGame } from "@/lib/types";

export function CartClient() {
  const router = useRouter();
  const { user } = useAuth();
  const { gameIds, removeFromCart, replaceCart, clearCart } = useCart();
  const [games, setGames] = useState<BoardGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [buyingAll, setBuyingAll] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadGames() {
      if (gameIds.length === 0) {
        setGames([]);
        return;
      }

      try {
        setLoading(true);
        setError("");
        setActionError("");
        const fetchedGames = await fetchGamesByIds(gameIds);

        if (!isMounted) {
          return;
        }

        const gameMap = new Map(fetchedGames.map((game) => [game.id, game]));
        const currentGames = gameIds
          .map((gameId) => gameMap.get(gameId))
          .filter(Boolean) as BoardGame[];
        const activeGames = currentGames.filter((game) => !game.isSold);
        const activeGameIds = activeGames.map((game) => game.id);

        if (activeGameIds.length !== gameIds.length) {
          replaceCart(activeGameIds);
        }

        setGames(activeGames);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Nie udało się załadować koszyka.",
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (!hasFirebaseConfig) {
      return;
    }

    void loadGames();

    return () => {
      isMounted = false;
    };
  }, [gameIds, replaceCart]);

  async function refreshCartGames() {
    if (gameIds.length === 0) {
      setGames([]);
      return;
    }

    const fetchedGames = await fetchGamesByIds(gameIds);
    const gameMap = new Map(fetchedGames.map((game) => [game.id, game]));
    const currentGames = gameIds
      .map((gameId) => gameMap.get(gameId))
      .filter(Boolean) as BoardGame[];
    const activeGames = currentGames.filter((game) => !game.isSold);
    const activeGameIds = activeGames.map((game) => game.id);

    if (activeGameIds.length !== gameIds.length) {
      replaceCart(activeGameIds);
    }

    setGames(activeGames);
  }

  async function handleBuyAll() {
    if (!user) {
      router.push("/login");
      return;
    }

    const availableGames = games.filter(
      (game) => !game.isSold && !game.isAuction && game.sellerId !== user.uid,
    );

    if (availableGames.length === 0) {
      setActionError("Brak gier dostępnych do kupienia.");
      return;
    }

    try {
      setActionError("");
      setBuyingAll(true);

      for (const game of availableGames) {
        await buyNow(game.id, user);
      }

      await refreshCartGames();
    } catch (buyError) {
      setActionError(
        buyError instanceof Error
          ? buyError.message
          : "Nie udało się kupić wszystkich gier z koszyka.",
      );
      await refreshCartGames();
    } finally {
      setBuyingAll(false);
    }
  }

  if (!hasFirebaseConfig) {
    return (
      <div className="status-box">
        <p>Brak konfiguracji Firebase.</p>
        <p className="error-text">
          Uzupełnij plik <code>.env.local</code> w folderze <code>lab4i5</code>.
        </p>
      </div>
    );
  }

  const availableGames = games.filter(
    (game) => !game.isSold && !game.isAuction && (!user || game.sellerId !== user.uid),
  );

  return (
    <section className="page-section">
      <h1 className="page-title">Koszyk</h1>

      {loading ? <div className="status-box">Ładowanie koszyka...</div> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {actionError ? <p className="error-text">{actionError}</p> : null}

      {!loading && gameIds.length === 0 ? (
        <div className="status-box">Koszyk jest pusty.</div>
      ) : null}

      {!loading && games.length > 0 ? (
        <>
          <div className="form-actions">
            <button
              type="button"
              className="button button--primary"
              disabled={buyingAll || availableGames.length === 0}
              onClick={handleBuyAll}
            >
              {buyingAll ? "Kupowanie..." : "Kup teraz"}
            </button>
            <button
              type="button"
              className="button button--light"
              onClick={clearCart}
            >
              Wyczyść koszyk
            </button>
          </div>
          <div className="cart-list">
            {games.map((game) => (
              <article
                key={game.id}
                className={`cart-item${game.isSold ? " cart-item--sold" : ""}`}
              >
                <div className="cart-item__meta">
                  <Link href={`/games/${game.id}`} className="cart-item__title">
                    {game.title}
                  </Link>
                  <p className="text-muted">
                    {game.isSold ? "Sprzedana" : game.isAuction ? "Licytacja" : "Dostępna"}
                  </p>
                  <p className="price">{game.price_pln.toFixed(2)} zł</p>
                </div>
                <div className="cart-item__actions">
                  <Link href={`/games/${game.id}`} className="button button--light">
                    Szczegóły
                  </Link>
                  <button
                    type="button"
                    className="button button--accent"
                    onClick={() => removeFromCart(game.id)}
                  >
                    Usuń
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
