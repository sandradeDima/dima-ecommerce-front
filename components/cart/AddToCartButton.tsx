"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/hooks/useCart";
import type { CartProductSource } from "@/lib/cart/cartTypes";
import { buildCartItemFromProduct } from "@/lib/cart/cartUtils";

type AddToCartButtonProps = {
  product: CartProductSource;
  quantity?: number;
  className?: string;
  label?: string;
  addedLabel?: string;
  imageUrl?: string | null;
  imagePath?: string | null;
  productPath?: string | null;
  productUrl?: string | null;
};

function CartPlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="M12 6v12M6 12h12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function AddToCartButton({
  product,
  quantity = 1,
  className = "",
  label = "Agregar al carrito",
  addedLabel = "Agregado",
  imageUrl,
  imagePath,
  productPath,
  productUrl,
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    if (!isAdded) {
      return;
    }

    const timer = window.setTimeout(() => {
      setIsAdded(false);
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [isAdded]);

  const cartItem = buildCartItemFromProduct(product, {
    quantity,
    imageUrl,
    imagePath,
    productPath,
    productUrl,
  });

  return (
    <button
      type="button"
      disabled={!cartItem}
      onClick={() => {
        if (!cartItem) {
          return;
        }

        addItem(cartItem);
        setIsAdded(true);
      }}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-[var(--dima-accent)] px-5 py-3 text-[13px] font-bold uppercase tracking-[0.1em] text-white transition hover:bg-[var(--dima-accent-strong)] disabled:cursor-not-allowed disabled:bg-slate-300 ${className}`}
    >
      <CartPlusIcon />
      <span>{isAdded ? addedLabel : label}</span>
    </button>
  );
}
