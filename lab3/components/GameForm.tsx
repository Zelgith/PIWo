"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getTypes } from "@/lib/filterBoardGames";
import { addGame, loadGames, seedGamesIfEmpty, updateGame } from "@/lib/storage";
import { BoardGame, GameFormValues } from "@/lib/types";

type GameFormProps = {
  mode: "create" | "edit";
  gameId?: number;
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
    imagesText: game.images.join("\n"),
    descriptionText: game.description.join("\n"),
  };
}

function mapFormValuesToGame(values: GameFormValues, previousAuction: unknown | null): Omit<BoardGame, "id"> {
  return {
    title: values.title.trim(),
    type: values.type.trim(),
    price_pln: Number(values.price_pln),
    min_players: Number(values.min_players),
    max_players: Number(values.max_players),
    avg_play_time_minutes: Number(values.avg_play_time_minutes),
    publisher: values.publisher.trim(),
    is_expansion: values.is_expansion,
    images: values.imagesText
      .split("\n")
      .map((image) => image.trim())
      .filter(Boolean),
    description: values.descriptionText
      .split("\n")
      .map((paragraph) => paragraph.trim())
      .filter(Boolean),
    auction: previousAuction,
  };
}

export function GameForm({ mode, gameId }: GameFormProps) {
  const router = useRouter();
  const [games, setGames] = useState<BoardGame[]>([]);
  const [formValues, setFormValues] = useState<GameFormValues>(EMPTY_FORM_VALUES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadFormData() {
      try {
        const seededGames = await seedGamesIfEmpty();

        if (!isActive) {
          return;
        }

        setGames(seededGames);

        if (mode === "edit") {
          const gameToEdit = seededGames.find((game) => game.id === gameId);

          if (!gameToEdit) {
            setError("Nie znaleziono gry do edycji.");
            return;
          }

          setFormValues(mapGameToFormValues(gameToEdit));
        }
      } catch {
        if (!isActive) {
          return;
        }

        const fallbackGames = loadGames();
        setGames(fallbackGames);

        if (mode === "edit") {
          const gameToEdit = fallbackGames.find((game) => game.id === gameId);

          if (!gameToEdit) {
            setError("Nie znaleziono gry do edycji.");
            return;
          }

          setFormValues(mapGameToFormValues(gameToEdit));
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadFormData();

    return () => {
      isActive = false;
    };
  }, [gameId, mode]);

  const availableTypes = useMemo(() => {
    const types = getTypes(games);

    if (formValues.type && !types.includes(formValues.type)) {
      return [...types, formValues.type].sort();
    }

    return types;
  }, [formValues.type, games]);

  function handleChange<K extends keyof GameFormValues>(name: K, value: GameFormValues[K]) {
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
      return "Cena musi być liczbą wiekszą lub równą 0.";
    }

    if (Number.isNaN(minPlayers) || minPlayers < 1) {
      return "Minimalna liczba graczy musi być wieksza lub równa 1.";
    }

    if (Number.isNaN(maxPlayers) || maxPlayers < minPlayers) {
      return "Maksymalna liczba graczy nie może byc mniejsza od minimalnej.";
    }

    if (Number.isNaN(playTime) || playTime <= 0) {
      return "Czas gry musi byc większy od 0.";
    }

    return "";
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateForm();

    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setSubmitError("");

    if (mode === "create") {
      const createdGame = addGame(mapFormValuesToGame(formValues, null));
      router.push(`/games/${createdGame.id}`);
      return;
    }

    const gameToEdit = games.find((game) => game.id === gameId);

    if (!gameToEdit || gameId === undefined) {
      setSubmitError("Nie znaleziono gry do zapisania.");
      return;
    }

    const updatedGame = updateGame(
      gameId,
      {
        ...mapFormValuesToGame(formValues, gameToEdit.auction),
        id: gameId,
      },
    );

    if (!updatedGame) {
      setSubmitError("Nie udało się zapisać zmian.");
      return;
    }

    router.push(`/games/${updatedGame.id}`);
  }

  const cancelHref = mode === "edit" && gameId ? `/games/${gameId}` : "/";

  if (loading) {
    return <div className="status-box">Ładowanie formularza...</div>;
  }

  if (error) {
    return (
      <div className="status-box">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="breadcrumb">
        <Link href={cancelHref}>Powrót</Link>
      </div>

      <section className="page-section">
        <h1 className="page-title">
          {mode === "create" ? "Dodaj gre" : "Edytuj gre"}
        </h1>
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
                {availableTypes.map((type) => (
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
                onChange={(event) => handleChange("is_expansion", event.target.checked)}
              />
              <label htmlFor="isExpansion">Dodatek</label>
            </div>

            <div className="form-group form-group--full">
              <label htmlFor="images">Zdjecia (jeden URL w linii)</label>
              <textarea
                id="images"
                className="form-control"
                rows={4}
                value={formValues.imagesText}
                onChange={(event) => handleChange("imagesText", event.target.value)}
              />
              <p className="hint-text">Możesz zostawić puste, wtedy pojawi sie placeholder.</p>
            </div>

            <div className="form-group form-group--full">
              <label htmlFor="description">Opis (jeden akapit w linii)</label>
              <textarea
                id="description"
                className="form-control"
                rows={6}
                value={formValues.descriptionText}
                onChange={(event) => handleChange("descriptionText", event.target.value)}
              />
            </div>
          </div>

          {submitError ? <p className="error-text">{submitError}</p> : null}

          <div className="form-actions">
            <button type="submit" className="button button--primary">
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
