"use client";

import { useCart } from "@/hooks/useCart";

type CartIconButtonProps = {
  className?: string;
  countClassName?: string;
};

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M7 7.5h10l-1 8.5H8L7 7.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 7.5a3 3 0 1 1 6 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="9.2" cy="18.7" r="1.2" fill="currentColor" />
      <circle cx="14.8" cy="18.7" r="1.2" fill="currentColor" />
    </svg>
  );
}

export default function CartIconButton({
  className = "",
  countClassName = "",
}: CartIconButtonProps) {
  const { cartCount, openDrawer } = useCart();

  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-label={`Abrir carrito${cartCount > 0 ? ` (${cartCount})` : ""}`}
      className={`relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/35 bg-white/8 text-white transition hover:bg-white/12 ${className}`}
    >
      <CartIcon />
      {cartCount > 0 ? (
        <span
          className={`absolute -right-1 -top-1 inline-flex min-h-[22px] min-w-[22px] items-center justify-center rounded-full bg-[var(--dima-accent)] px-1.5 text-[11px] font-extrabold text-white shadow-[0_10px_18px_rgba(30,170,66,0.28)] ${countClassName}`}
        >
          {cartCount > 99 ? "99+" : cartCount}
        </span>
      ) : null}
    </button>
  );
}
