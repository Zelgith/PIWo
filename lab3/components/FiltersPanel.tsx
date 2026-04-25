"use client";

import { GameFilters } from "@/lib/types";

type FiltersPanelProps = {
  filters: GameFilters;
  publishers: string[];
  types: string[];
  onChange: (name: keyof GameFilters, value: string) => void;
};

export function FiltersPanel({
  filters,
  publishers,
  types,
  onChange,
}: FiltersPanelProps) {
  return (
    <section className="page-section">
      <h2 className="section-title">Wyszukiwanie i filtry</h2>
      <div className="filters-grid">
        <div className="form-group">
          <label htmlFor="query">Szukaj w opisie</label>
          <input
            id="query"
            className="form-control"
            type="text"
            placeholder="np. strategia"
            value={filters.query}
            onChange={(event) => onChange("query", event.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="minPrice">Cena od (zł)</label>
          <input
            id="minPrice"
            className="form-control"
            type="number"
            min="0"
            value={filters.minPrice}
            onChange={(event) => onChange("minPrice", event.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="maxPrice">Cena do (zł)</label>
          <input
            id="maxPrice"
            className="form-control"
            type="number"
            min="0"
            value={filters.maxPrice}
            onChange={(event) => onChange("maxPrice", event.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="type">Rodzaj</label>
          <select
            id="type"
            className="form-control"
            value={filters.type}
            onChange={(event) => onChange("type", event.target.value)}
          >
            <option value="">Wszystkie</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="players">Ilość graczy</label>
          <select
            id="players"
            className="form-control"
            value={filters.players}
            onChange={(event) => onChange("players", event.target.value)}
          >
            <option value="">Dowolna</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3-4">3-4</option>
            <option value="5-6">5-6</option>
            <option value="7+">7+</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="publisher">Wydawnictwo</label>
          <select
            id="publisher"
            className="form-control"
            value={filters.publisher}
            onChange={(event) => onChange("publisher", event.target.value)}
          >
            <option value="">Wszystkie</option>
            {publishers.map((publisher) => (
              <option key={publisher} value={publisher}>
                {publisher}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="playTime">Czas gry</label>
          <select
            id="playTime"
            className="form-control"
            value={filters.playTime}
            onChange={(event) => onChange("playTime", event.target.value)}
          >
            <option value="">Dowolny</option>
            <option value="30">do 30 min</option>
            <option value="60">do 60 min</option>
            <option value="120">do 120 min</option>
            <option value="121+">ponad 120 min</option>
          </select>
        </div>
      </div>
    </section>
  );
}
