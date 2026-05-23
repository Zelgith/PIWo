import { CartAction, CartState } from "@/lib/types";

export const CART_STORAGE_KEY = "lab4i5-cart";

export const EMPTY_CART_STATE: CartState = {
  gameIds: [],
};

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE":
      return {
        gameIds: [...new Set(action.payload)],
      };
    case "ADD_ITEM":
      if (state.gameIds.includes(action.payload)) {
        return state;
      }

      return {
        gameIds: [...state.gameIds, action.payload],
      };
    case "REMOVE_ITEM":
      return {
        gameIds: state.gameIds.filter((gameId) => gameId !== action.payload),
      };
    case "CLEAR_CART":
      return EMPTY_CART_STATE;
    default:
      return state;
  }
}
