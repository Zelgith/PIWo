"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import {
  CART_STORAGE_KEY,
  cartReducer,
  EMPTY_CART_STATE,
} from "@/lib/cartReducer";

type CartContextValue = {
  gameIds: string[];
  itemCount: number;
  isInCart: (gameId: string) => boolean;
  addToCart: (gameId: string) => void;
  removeFromCart: (gameId: string) => void;
  replaceCart: (gameIds: string[]) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, EMPTY_CART_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);

      if (savedCart) {
        const parsedCart = JSON.parse(savedCart) as unknown;

        if (
          parsedCart &&
          typeof parsedCart === "object" &&
          "gameIds" in parsedCart &&
          Array.isArray(parsedCart.gameIds)
        ) {
          dispatch({
            type: "HYDRATE",
            payload: parsedCart.gameIds.filter(
              (gameId): gameId is string => typeof gameId === "string",
            ),
          });
        }
      }
    } catch {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  const value = useMemo<CartContextValue>(
    () => ({
      gameIds: state.gameIds,
      itemCount: state.gameIds.length,
      isInCart: (gameId) => state.gameIds.includes(gameId),
      addToCart: (gameId) => dispatch({ type: "ADD_ITEM", payload: gameId }),
      removeFromCart: (gameId) =>
        dispatch({ type: "REMOVE_ITEM", payload: gameId }),
      replaceCart: (gameIds) => dispatch({ type: "HYDRATE", payload: gameIds }),
      clearCart: () => dispatch({ type: "CLEAR_CART" }),
    }),
    [state.gameIds],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart musi być użyty wewnątrz CartProvider.");
  }

  return context;
}
