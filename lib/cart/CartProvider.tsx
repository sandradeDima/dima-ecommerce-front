"use client";

import { createContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { CartContextValue, CartItem } from "./cartTypes";
import {
  calculateCartTotals,
  CART_STORAGE_KEY,
  mergeCartItems,
  parseStoredCartItems,
} from "./cartUtils";

export const CartContext = createContext<CartContextValue | null>(null);

type CartProviderProps = {
  children: ReactNode;
};

export default function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let isCancelled = false;

    queueMicrotask(() => {
      if (isCancelled) {
        return;
      }

      const storedItems = parseStoredCartItems(window.localStorage.getItem(CART_STORAGE_KEY));
      setItems(storedItems);
      setIsHydrated(true);
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [isHydrated, items]);

  const totals = calculateCartTotals(items);

  const value: CartContextValue = {
    items,
    isHydrated,
    isDrawerOpen,
    cartCount: totals.totalQuantity,
    totals,
    addItem: (item) => {
      setItems((currentItems) => {
        const existingIndex = currentItems.findIndex(
          (currentItem) => currentItem.cartKey === item.cartKey,
        );

        if (existingIndex === -1) {
          return [...currentItems, item];
        }

        return currentItems.map((currentItem, index) =>
          index === existingIndex ? mergeCartItems(currentItem, item) : currentItem,
        );
      });
      setIsDrawerOpen(true);
    },
    removeItem: (cartKey) => {
      setItems((currentItems) =>
        currentItems.filter((currentItem) => currentItem.cartKey !== cartKey),
      );
    },
    incrementItem: (cartKey) => {
      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.cartKey === cartKey
            ? {
                ...currentItem,
                quantity: Math.min(999, currentItem.quantity + 1),
              }
            : currentItem,
        ),
      );
    },
    decrementItem: (cartKey) => {
      setItems((currentItems) =>
        currentItems.flatMap((currentItem) => {
          if (currentItem.cartKey !== cartKey) {
            return [currentItem];
          }

          if (currentItem.quantity <= 1) {
            return [];
          }

          return [
            {
              ...currentItem,
              quantity: currentItem.quantity - 1,
            },
          ];
        }),
      );
    },
    updateQuantity: (cartKey, quantity) => {
      if (!Number.isFinite(quantity)) {
        return;
      }

      if (quantity <= 0) {
        setItems((currentItems) =>
          currentItems.filter((currentItem) => currentItem.cartKey !== cartKey),
        );
        return;
      }

      const normalizedQuantity = Math.max(1, Math.min(999, Math.round(quantity)));
      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.cartKey === cartKey
            ? {
                ...currentItem,
                quantity: normalizedQuantity,
              }
            : currentItem,
        ),
      );
    },
    clearCart: () => {
      setItems([]);
    },
    openDrawer: () => {
      setIsDrawerOpen(true);
    },
    closeDrawer: () => {
      setIsDrawerOpen(false);
    },
    toggleDrawer: () => {
      setIsDrawerOpen((currentValue) => !currentValue);
    },
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
