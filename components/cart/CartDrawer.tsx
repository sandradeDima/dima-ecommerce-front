"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getInformacion, type InformacionItem } from "@/lib/api";
import { useCart } from "@/hooks/useCart";
import type { CartItem } from "@/lib/cart/cartTypes";
import {
  formatCartLinePrice,
  formatCartLineSubtotal,
  formatCurrency,
  getCompanyWhatsappLabel,
} from "@/lib/cart/cartUtils";
import CheckoutModal from "./CheckoutModal";

type CompanyInfoState = (InformacionItem & {
  whatsapp?: string | null;
  numero_whatsapp?: string | null;
}) | null;

type QuantityFieldProps = {
  item: CartItem;
  onUpdate: (quantity: number) => void;
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
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M6 6 18 18M18 6 6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="M6 12h12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusIcon() {
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

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="M5.5 7.5h13M9 7.5V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1.5m-8.2 0 .8 10.2a1 1 0 0 0 1 .8h6.8a1 1 0 0 0 1-.8l.8-10.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function QuantityField({ item, onUpdate }: QuantityFieldProps) {
  const [draftValue, setDraftValue] = useState(String(item.quantity));

  return (
    <input
      type="text"
      inputMode="numeric"
      value={draftValue}
      onChange={(event) => {
        const digitsOnly = event.target.value.replace(/\D+/g, "");
        setDraftValue(digitsOnly);
      }}
      onBlur={() => {
        if (!draftValue.trim()) {
          setDraftValue(String(item.quantity));
          return;
        }

        const parsed = Number(draftValue);
        if (!Number.isFinite(parsed)) {
          setDraftValue(String(item.quantity));
          return;
        }

        onUpdate(parsed);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
      }}
      className="h-10 w-14 rounded-[14px] border border-[var(--dima-line)] bg-white text-center text-[14px] font-semibold text-[var(--dima-ink)] outline-none transition focus:border-[var(--dima-primary)]"
      aria-label={`Cantidad para ${item.nombre}`}
    />
  );
}

export default function CartDrawer() {
  const {
    items,
    isDrawerOpen,
    cartCount,
    totals,
    closeDrawer,
    clearCart,
    decrementItem,
    incrementItem,
    removeItem,
    updateQuantity,
  } = useCart();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfoState>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadCompanyInfo = async () => {
      try {
        const response = await getInformacion();
        if (isCancelled) {
          return;
        }

        setCompanyInfo(response?.Informacion ?? null);
      } catch {
        if (!isCancelled) {
          setCompanyInfo(null);
        }
      }
    };

    void loadCompanyInfo();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isDrawerOpen && !isCheckoutOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isCheckoutOpen, isDrawerOpen]);

  const whatsappLabel = getCompanyWhatsappLabel(companyInfo);
  const handleCloseDrawer = () => {
    setIsCheckoutOpen(false);
    closeDrawer();
  };

  return (
    <>
      <div className={`fixed inset-0 z-[85] ${isDrawerOpen ? "" : "pointer-events-none"}`}>
        <button
          type="button"
          aria-label="Cerrar carrito"
          onClick={handleCloseDrawer}
          className={`absolute inset-0 bg-[rgba(11,20,40,0.44)] backdrop-blur-[2px] transition ${
            isDrawerOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <aside
          className={`absolute right-0 top-0 flex h-full w-full max-w-[460px] flex-col border-l border-white/30 bg-[linear-gradient(180deg,#f9fbff_0%,#eef4ff_100%)] shadow-[0_20px_60px_rgba(10,24,58,0.24)] transition-transform duration-300 ${
            isDrawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <header className="flex items-center justify-between border-b border-[var(--dima-line)] px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--dima-primary)] text-white shadow-[0_12px_24px_rgba(37,76,169,0.24)]">
                <CartIcon />
              </span>
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--dima-primary)]">
                  Carrito Dima
                </p>
                <h2 className="text-[22px] font-bold text-[var(--dima-ink)]">
                  {cartCount > 0 ? `${cartCount} producto(s)` : "Tu carrito"}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCloseDrawer}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--dima-line)] text-[var(--dima-ink-soft)] transition hover:bg-white"
              aria-label="Cerrar carrito"
            >
              <CloseIcon />
            </button>
          </header>

          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <div className="rounded-full bg-[var(--dima-surface-soft)] p-5 text-[var(--dima-primary)]">
                <CartIcon />
              </div>
              <h3 className="mt-5 text-[22px] font-bold text-[var(--dima-ink)]">
                Tu carrito esta vacio
              </h3>
              <p className="mt-2 max-w-[26ch] text-[14px] leading-relaxed text-[var(--dima-ink-soft)]">
                Agrega productos desde el catalogo o desde el detalle para cotizarlos por
                WhatsApp.
              </p>
              <button
                type="button"
                onClick={closeDrawer}
                className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-[var(--dima-primary)] px-6 text-[13px] font-bold uppercase tracking-[0.1em] text-white transition hover:bg-[var(--dima-primary-strong)]"
              >
                Seguir explorando
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="space-y-4">
                  {items.map((item) => (
                    <article
                      key={item.cartKey}
                      className="rounded-[24px] border border-[var(--dima-line)] bg-white p-4 shadow-[0_12px_26px_rgba(15,23,42,0.08)]"
                    >
                      <div className="flex gap-3">
                        <Link
                          href={item.productPath}
                          onClick={closeDrawer}
                          className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-[var(--dima-surface-soft)] p-2"
                        >
                          {item.imagenUrl ? (
                            <img
                              src={item.imagenUrl}
                              alt={item.altImagen || item.nombre}
                              title={item.titleImagen || item.nombre}
                              className="h-full w-full object-contain"
                              loading="lazy"
                            />
                          ) : (
                            <span className="text-[12px] text-[var(--dima-ink-soft)]">
                              Sin imagen
                            </span>
                          )}
                        </Link>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <Link
                                href={item.productPath}
                                onClick={handleCloseDrawer}
                                className="line-clamp-2 text-[15px] font-bold leading-snug text-[var(--dima-ink)] transition hover:text-[var(--dima-primary)]"
                              >
                                {item.nombre}
                              </Link>
                              <div className="mt-1 space-y-1 text-[12px] text-[var(--dima-ink-soft)]">
                                {item.skuDima ? <p>SKU Dima: {item.skuDima}</p> : null}
                                {item.sku &&
                                item.sku !== item.skuDima ? (
                                  <p>SKU: {item.sku}</p>
                                ) : null}
                                {item.marca ? <p>Marca: {item.marca}</p> : null}
                                {item.categoria ? <p>Categoria: {item.categoria}</p> : null}
                                {item.subcategoria ? <p>Subcategoria: {item.subcategoria}</p> : null}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeItem(item.cartKey)}
                              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--dima-line)] text-[var(--dima-ink-soft)] transition hover:border-[#D55643] hover:text-[#D55643]"
                              aria-label={`Eliminar ${item.nombre}`}
                            >
                              <TrashIcon />
                            </button>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--dima-ink-soft)]">
                                Precio
                              </p>
                              <p className="mt-1 text-[15px] font-semibold text-[var(--dima-ink)]">
                                {formatCartLinePrice(item)}
                              </p>
                              <p className="mt-1 text-[12px] text-[var(--dima-ink-soft)]">
                                Subtotal: {formatCartLineSubtotal(item)}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => decrementItem(item.cartKey)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--dima-line)] bg-white text-[var(--dima-ink)] transition hover:border-[var(--dima-primary)] hover:text-[var(--dima-primary)]"
                                aria-label={`Reducir cantidad de ${item.nombre}`}
                              >
                                <MinusIcon />
                              </button>

                              <QuantityField
                                key={`${item.cartKey}-${item.quantity}`}
                                item={item}
                                onUpdate={(quantity) => updateQuantity(item.cartKey, quantity)}
                              />

                              <button
                                type="button"
                                onClick={() => incrementItem(item.cartKey)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--dima-line)] bg-white text-[var(--dima-ink)] transition hover:border-[var(--dima-primary)] hover:text-[var(--dima-primary)]"
                                aria-label={`Aumentar cantidad de ${item.nombre}`}
                              >
                                <PlusIcon />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <footer className="border-t border-[var(--dima-line)] bg-white/92 px-4 py-4">
                <div className="rounded-[24px] border border-[var(--dima-line)] bg-[var(--dima-page)] p-4">
                  <div className="flex items-center justify-between text-[14px] text-[var(--dima-ink-soft)]">
                    <span>Total de unidades</span>
                    <strong className="text-[var(--dima-ink)]">{totals.totalQuantity}</strong>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[14px] text-[var(--dima-ink-soft)]">
                    <span>Total estimado</span>
                    <strong className="text-[var(--dima-ink)]">
                      {totals.hasPricedItems ? formatCurrency(totals.subtotal) : "Consultar precio"}
                    </strong>
                  </div>

                  {totals.hasUnpricedItems ? (
                    <p className="mt-3 text-[12px] leading-relaxed text-[var(--dima-ink-soft)]">
                      {totals.unpricedItemsCount} producto(s) no tienen precio publicado. El
                      equipo Dima confirmara el total final.
                    </p>
                  ) : null}

                  {whatsappLabel ? (
                    <p className="mt-3 text-[12px] leading-relaxed text-[var(--dima-primary)]">
                      Se enviará al WhatsApp de Dima: {whatsappLabel}
                    </p>
                  ) : (
                    <p className="mt-3 text-[12px] leading-relaxed text-[#A53D2B]">
                      No pudimos confirmar el número de WhatsApp de Dima todavía.
                    </p>
                  )}
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      clearCart();
                      setIsCheckoutOpen(false);
                    }}
                    className="inline-flex h-12 flex-1 items-center justify-center rounded-full border border-[var(--dima-line)] bg-white px-4 text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--dima-ink-soft)] transition hover:border-[#D55643] hover:text-[#D55643]"
                  >
                    Vaciar carrito
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCheckoutOpen(true)}
                    className="inline-flex h-12 flex-[1.2] items-center justify-center rounded-full bg-[var(--dima-accent)] px-4 text-[12px] font-bold uppercase tracking-[0.08em] text-white transition hover:bg-[var(--dima-accent-strong)]"
                  >
                    Finalizar pedido
                  </button>
                </div>
              </footer>
            </>
          )}
        </aside>
      </div>

      {isCheckoutOpen && isDrawerOpen && items.length > 0 ? (
        <CheckoutModal
          items={items}
          companyInfo={companyInfo}
          onClose={() => setIsCheckoutOpen(false)}
          onCheckoutSuccess={() => {
            clearCart();
            setIsCheckoutOpen(false);
            closeDrawer();
          }}
        />
      ) : null}
    </>
  );
}
