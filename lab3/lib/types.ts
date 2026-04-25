export type BoardGame = {
  id: number;
  title: string;
  images: string[];
  description: string[];
  min_players: number;
  max_players: number;
  avg_play_time_minutes: number;
  publisher: string;
  is_expansion: boolean;
  price_pln: number;
  auction: unknown | null;
  type: string;
};

export type GameFilters = {
  query: string;
  minPrice: string;
  maxPrice: string;
  type: string;
  players: string;
  publisher: string;
  playTime: string;
};

export type GameFormValues = {
  title: string;
  type: string;
  price_pln: string;
  min_players: string;
  max_players: string;
  avg_play_time_minutes: string;
  publisher: string;
  is_expansion: boolean;
  imagesText: string;
  descriptionText: string;
};
