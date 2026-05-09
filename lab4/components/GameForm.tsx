"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { AVAILABLE_GAME_TYPES } from "@/lib/filterBoardGames";
import {
  createGame,
  fetchGameById,
  updateOwnGame,
} from "@/lib/firestoreGames";
import { hasFirebaseConfig } from "@/lib/firebase";
import { BoardGame, BoardGameDraft, GameFormValues } from "@/lib/types";

type GameFormProps = {
  mode: "create" | "edit";
  gameId?: string;
};

const EMPTY_FORM_VALUES: GameFormValues = {
  title: "",
  type: "",
  price_pln: "",
  min_players: "1",
  max_players: "1",
  avg_play_time_minutes: "",
  publisher: "",
  is_expansion: false,
  isAuction: false,
  imagesText: "",
  descriptionText: "",
};

function mapGameToFormValues(game: BoardGame): GameFormValues {
  return {
    title: game.title,
    type: game.type,
    price_pln: String(game.price_pln),
    min_players: String(game.min_players),
    max_players: String(game.max_players),
    avg_play_time_minutes: String(game.avg_play_time_minutes),
    publisher: game.publisher,
    is_expansion: game.is_expansion,
    isAuction: game.isAuction,
    imagesText: game.images.join("\n"),
    descriptionText: game.description.join("\n"),
  };
}

function mapFormValuesToGame(values: GameFormValues): BoardGameDraft {
  return {
    title: values.title.trim(),
    type: values.type.trim(),
    price_pln: Number(values.price_pln),
    min_players: Number(values.min_players),
    max_players: Number(values.max_players),
    avg_play_time_minutes: Number(values.avg_play_time_minutes),
    publisher: values.publisher.trim(),
    is_expansion: values.is_expansion,
    isAuction: values.isAuction,
    images: values.imagesText
      .split("\n")
      .map((image) => image.trim())
      .filter(Boolean),
    description: values.descriptionText
      .split("\n")
      .map((paragraph) => paragraph.trim())
      .filter(Boolean),
  };
}

export function GameForm({ mode, gameId }: GameFormProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [game, setGame] = useState<BoardGame | null>(null);
  const [formValues, setFormValues] = useState<GameFormValues>(EMPTY_FORM_VALUES);
  const [loading, setLoading] = useState(mode === "edit");
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    async function loadFormData() {
      if (mode !== "edit" || !gameId) {
        setLoading(false);
        return;
      }

      try {
        const gameToEdit = await fetchGameById(gameId);

        if (!gameToEdit) {
          setError("Nie znaleziono gry do edycji.");
          return;
        }

        setGame(gameToEdit);
        setFormValues(mapGameToFormValues(gameToEdit));
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Nie udało się załadować formularza.",
        );
      } finally {
        setLoading(false);
      }
    }

    if (!hasFirebaseConfig || authLoading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (mode === "create") {
      return;
    }

    void loadFormData();
  }, [authLoading, gameId, mode, router, user]);

  useEffect(() => {
    if (!loading && !authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, loading, router, user]);

  function handleChange<K extends keyof GameFormValues>(
    name: K,
    value: GameFormValues[K],
  ) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));
  }

  function validateForm() {
    if (!formValues.title.trim()) {
      return "Tytuł jest wymagany.";
    }

    if (!formValues.type.trim()) {
      return "Typ jest wymagany.";
    }

    if (!formValues.publisher.trim()) {
      return "Wydawnictwo jest wymagane.";
    }

    if (!formValues.descriptionText.trim()) {
      return "Opis jest wymagany.";
    }

    const price = Number(formValues.price_pln);
    const minPlayers = Number(formValues.min_players);
    const maxPlayers = Number(formValues.max_players);
    const playTime = Number(formValues.avg_play_time_minutes);

    if (Number.isNaN(price) || price < 0) {
      return "Cena musi być liczbą większą lub równą 0.";
    }

    if (Number.isNaN(minPlayers) || minPlayers < 1) {
      return "Minimalna liczba graczy musi być większa lub równa 1.";
    }

    if (Number.isNaN(maxPlayers) || maxPlayers < minPlayers) {
      return "Maksymalna liczba graczy nie może być mniejsza od minimalnej.";
    }

    if (Number.isNaN(playTime) || playTime <= 0) {
      return "Czas gry musi być większy od 0.";
    }

    return "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setSubmitError("Zaloguj się, aby zapisać ofertę.");
      router.push("/login");
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    try {
      setSubmitError("");

      if (mode === "create") {
        const createdGame = await createGame(mapFormValuesToGame(formValues), user);
        router.push(`/games/${createdGame.id}`);
        return;
      }

      if (!game || !gameId) {
        setSubmitError("Nie znaleziono gry do zapisania.");
        return;
      }

      const updatedGame = await updateOwnGame(
        gameId,
        mapFormValuesToGame(formValues),
        user,
      );
      router.push(`/games/${updatedGame.id}`);
    } catch (saveError) {
      setSubmitError(
        saveError instanceof Error
          ? saveError.message
          : "Nie udało się zapisać zmian.",
      );
    }
  }

  const cancelHref = mode === "edit" && gameId ? `/games/${gameId}` : "/";

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

  if (authLoading || loading) {
    return <div className="status-box">Ładowanie formularza...</div>;
  }

  if (!user) {
    return <div className="status-box">Przekierowanie do logowania...</div>;
  }

  if (error) {
    return (
      <div className="status-box">
        <p>{error}</p>
      </div>
    );
  }

  const isEditingBlocked =
    mode === "edit" &&
    !!game &&
    (game.isSold || (game.isAuction && game.bidCount > 0));

  return (
    <>
      <div className="breadcrumb">
        <Link href={cancelHref}>Powrót</Link>
      </div>

      <section className="page-section">
        <h1 className="page-title">
          {mode === "create" ? "Dodaj grę" : "Edytuj grę"}
        </h1>
        {isEditingBlocked ? (
          <p className="error-text">
            Nie można edytować sprzedanej gry ani aukcji, która ma już oferty.
          </p>
        ) : null}
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="title">Tytuł gry</label>
              <input
                id="title"
                className="form-control"
                type="text"
                value={formValues.title}
                onChange={(event) => handleChange("title", event.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="type">Rodzaj</label>
              <select
                id="type"
                className="form-control"
                value={formValues.type}
                onChange={(event) => handleChange("type", event.target.value)}
              >
                <option value="">Wybierz</option>
                {AVAILABLE_GAME_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="price">Cena (zł)</label>
              <input
                id="price"
                className="form-control"
                type="number"
                min="0"
                step="0.01"
                value={formValues.price_pln}
                onChange={(event) => handleChange("price_pln", event.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="minPlayers">Min. graczy</label>
              <input
                id="minPlayers"
                className="form-control"
                type="number"
                min="1"
                value={formValues.min_players}
                onChange={(event) => handleChange("min_players", event.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="maxPlayers">Max. graczy</label>
              <input
                id="maxPlayers"
                className="form-control"
                type="number"
                min="1"
                value={formValues.max_players}
                onChange={(event) => handleChange("max_players", event.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="playTime">Czas gry (min)</label>
              <input
                id="playTime"
                className="form-control"
                type="number"
                min="1"
                value={formValues.avg_play_time_minutes}
                onChange={(event) =>
                  handleChange("avg_play_time_minutes", event.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="publisher">Wydawnictwo</label>
              <input
                id="publisher"
                className="form-control"
                type="text"
                value={formValues.publisher}
                onChange={(event) => handleChange("publisher", event.target.value)}
              />
            </div>

            <div className="checkbox-row">
              <input
                id="isExpansion"
                className="form-control"
                type="checkbox"
                checked={formValues.is_expansion}
                onChange={(event) =>
                  handleChange("is_expansion", event.target.checked)
                }
              />
              <label htmlFor="isExpansion">Dodatek</label>
            </div>

            <div className="checkbox-row">
              <input
                id="isAuction"
                className="form-control"
                type="checkbox"
                checked={formValues.isAuction}
                onChange={(event) => handleChange("isAuction", event.target.checked)}
              />
              <label htmlFor="isAuction">Licytacja</label>
            </div>

            <div className="form-group form-group--full">
              <label htmlFor="images">Zdjęcia (jeden URL w linii)</label>
              <textarea
                id="images"
                className="form-control"
                rows={4}
                value={formValues.imagesText}
                onChange={(event) => handleChange("imagesText", event.target.value)}
              />
              <p className="hint-text">
                Możesz zostawić puste, wtedy pojawi się placeholder.
              </p>
            </div>

            <div className="form-group form-group--full">
              <label htmlFor="description">Opis (jeden akapit w linii)</label>
              <textarea
                id="description"
                className="form-control"
                rows={6}
                value={formValues.descriptionText}
                onChange={(event) =>
                  handleChange("descriptionText", event.target.value)
                }
              />
            </div>
          </div>

          {submitError ? <p className="error-text">{submitError}</p> : null}

          <div className="form-actions">
            <button
              type="submit"
              className="button button--primary"
              disabled={isEditingBlocked}
            >
              Zapisz
            </button>
            <Link href={cancelHref} className="button button--light">
              Anuluj
            </Link>
          </div>
        </form>
      </section>
    </>
  );
}
