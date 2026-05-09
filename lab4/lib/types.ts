import type { Timestamp } from "firebase/firestore";

export type BoardGame = {
  id: string;
  title: string;
  images: string[];
  description: string[];
  min_players: number;
  max_players: number;
  avg_play_time_minutes: number;
  publisher: string;
  is_expansion: boolean;
  price_pln: number;
  type: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  isSold: boolean;
  buyerId: string | null;
  buyerName: string | null;
  soldAt: Timestamp | null;
  isAuction: boolean;
  currentBidPln: number | null;
  highestBidderId: string | null;
  highestBidderName: string | null;
  bidCount: number;
};

export type BoardGameSeed = {
  legacyId: string;
  title: string;
  images: string[];
  description: string[];
  min_players: number;
  max_players: number;
  avg_play_time_minutes: number;
  publisher: string;
  is_expansion: boolean;
  price_pln: number;
  type: string;
  isAuction: boolean;
};

export type BoardGameDraft = {
  title: string;
  images: string[];
  description: string[];
  min_players: number;
  max_players: number;
  avg_play_time_minutes: number;
  publisher: string;
  is_expansion: boolean;
  price_pln: number;
  type: string;
  isAuction: boolean;
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
  isAuction: boolean;
  imagesText: string;
  descriptionText: string;
};
