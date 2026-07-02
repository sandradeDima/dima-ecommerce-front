"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createCheckoutPedido,
  type CheckoutPedidoPayload,
  type InformacionItem,
} from "@/lib/api";
import type {
  CartItem,
  CheckoutFieldErrors,
  CheckoutFormValues,
} from "@/lib/cart/cartTypes";
import {
  buildFullPhoneNumber,
  buildWhatsAppCheckoutMessage,
  calculateCartTotals,
  formatCartLineSubtotal,
  formatCurrency,
  normalizePhonePrefix,
  resolveCompanyWhatsappNumber,
  resolveAbsoluteProductUrl,
  validateCheckoutForm,
} from "@/lib/cart/cartUtils";
import {
  getFallbackMapEmbedUrl,
  isPotentialGoogleMapsShortUrl,
  resolveMapEmbedSrc,
} from "@/lib/maps/googleMaps";

type CheckoutModalProps = {
  items: CartItem[];
  companyInfo: (InformacionItem & {
    whatsapp?: string | null;
    numero_whatsapp?: string | null;
  }) | null;
  onClose: () => void;
  onCheckoutSuccess: () => void;
};

const initialValues: CheckoutFormValues = {
  name: "",
  phonePrefix: "+591",
  phone: "",
  city: "",
  location: "",
  address: "",
  notes: "",
  nit: "",
  razonSocial: "",
};

const PHONE_PREFIX_SUGGESTIONS = ["+591", "+54", "+55", "+56", "+57", "+58", "+1"];

type FormFieldProps = {
  id: keyof CheckoutFormValues | string;
  label: string;
  value: string;
  error?: string;
  required?: boolean;
  multiline?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
};

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

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="M12 21s6-5.6 6-11a6 6 0 1 0-12 0c0 5.4 6 11 6 11Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 animate-spin">
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="2"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FieldLabel({
  label,
  required = false,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--dima-ink-soft)]">
      {label}
      {required ? " *" : ""}
    </span>
  );
}

function FormField({
  id,
  label,
  value,
  error,
  required = false,
  multiline = false,
  placeholder = "",
  onChange,
}: FormFieldProps) {
  const commonClassName =
    "w-full rounded-[18px] border bg-white px-4 py-3 text-[14px] text-[var(--dima-ink)] outline-none transition placeholder:text-[var(--dima-ink-soft)]";
  const borderClassName = error
    ? "border-[#D55643] focus:border-[#D55643]"
    : "border-[var(--dima-line)] focus:border-[var(--dima-primary)]";

  return (
    <label className="block">
      <FieldLabel label={label} required={required} />
      {multiline ? (
        <textarea
          id={id}
          value={value}
          rows={4}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`${commonClassName} min-h-[116px] resize-y ${borderClassName}`}
        />
      ) : (
        <input
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`${commonClassName} ${borderClassName}`}
        />
      )}
      {error ? <p className="mt-1 text-[12px] text-[#D55643]">{error}</p> : null}
    </label>
  );
}

function buildCheckoutPayload(params: {
  items: CartItem[];
  values: CheckoutFormValues;
  origin: string;
  whatsappNumber: string;
  whatsappUrl: string;
}) {
  const { items, values, origin, whatsappNumber, whatsappUrl } = params;
  const totals = calculateCartTotals(items);

  const payload: CheckoutPedidoPayload = {
    nombre: values.name.trim(),
    telefono_prefijo: normalizePhonePrefix(values.phonePrefix),
    telefono: values.phone.trim(),
    ciudad: values.city.trim(),
    ubicacion: values.location.trim() || null,
    direccion: values.address.trim(),
    notas: values.notes.trim() || null,
    nit: values.nit.trim() || null,
    razon_social: values.razonSocial.trim() || null,
    items: items.map((item) => ({
      id: item.id,
      nombre: item.nombre,
      slug: item.slug,
      sku: item.sku,
      sku_dima: item.skuDima,
      marca: item.marca,
      categoria: item.categoria,
      subcategoria: item.subcategoria,
      cantidad: item.quantity,
      precio_unitario: item.unitPrice,
      precio_unitario_texto: item.unitPriceLabel,
      subtotal_texto: formatCartLineSubtotal(item),
      url_producto: resolveAbsoluteProductUrl(item, origin),
    })),
    resumen: {
      total_cantidad: totals.totalQuantity,
      total_items_unicos: totals.uniqueItemsCount,
      items_con_precio: totals.pricedItemsCount,
      items_sin_precio: totals.unpricedItemsCount,
      subtotal: totals.subtotal,
      tiene_items_con_precio: totals.hasPricedItems,
      tiene_items_sin_precio: totals.hasUnpricedItems,
    },
    meta: {
      origen: origin,
      whatsapp_destino: whatsappNumber,
      whatsapp_url: whatsappUrl,
    },
  };

  return payload;
}

export default function CheckoutModal({
  items,
  companyInfo,
  onClose,
  onCheckoutSuccess,
}: CheckoutModalProps) {
  const [values, setValues] = useState<CheckoutFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<CheckoutFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapEmbedSrc, setMapEmbedSrc] = useState<string>(getFallbackMapEmbedUrl());
  const [isResolvingMap, setIsResolvingMap] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);

  const totals = calculateCartTotals(items);
  const fullPhoneNumber = useMemo(() => buildFullPhoneNumber(values), [values]);

  useEffect(() => {
    const rawUrl = values.location.trim();
    const baseEmbed = resolveMapEmbedSrc(rawUrl);
    setMapEmbedSrc(baseEmbed);

    if (!rawUrl || !isPotentialGoogleMapsShortUrl(rawUrl)) {
      setIsResolvingMap(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const resolveShortUrl = async () => {
      setIsResolvingMap(true);

      try {
        const params = new URLSearchParams({ url: rawUrl });
        const response = await fetch(`/api/maps/embed?${params.toString()}`, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok || cancelled) {
          return;
        }

        const data = (await response.json()) as { embedSrc?: string };
        if (data.embedSrc && !cancelled) {
          setMapEmbedSrc(data.embedSrc);
        }
      } catch {
        // Keep the best-effort embed already shown.
      } finally {
        if (!cancelled) {
          setIsResolvingMap(false);
        }
      }
    };

    void resolveShortUrl();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [values.location]);

  const updateValue = <K extends keyof CheckoutFormValues>(key: K, value: CheckoutFormValues[K]) => {
    setValues((currentValues) => ({ ...currentValues, [key]: value }));
    setFieldErrors((currentErrors) => ({ ...currentErrors, [key]: undefined }));
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setSubmitError("Tu navegador no permite obtener la ubicación actual.");
      return;
    }

    setSubmitError(null);
    setIsLocatingUser(true);

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const locationUrl = `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;
        updateValue("location", locationUrl);
        setIsLocatingUser(false);
      },
      () => {
        setIsLocatingUser(false);
        setSubmitError(
          "No pudimos obtener tu ubicación. Puedes pegar un enlace de Google Maps o escribir una referencia.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
      },
    );
  };

  const handleSubmit = async () => {
    console.log("[CheckoutModal] handleSubmit start", {
      values,
      itemsCount: items.length,
      companyInfo,
    });

    const errors = validateCheckoutForm(values);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitError("Completa los campos obligatorios para continuar.");
      console.warn("[CheckoutModal] validation errors", errors);
      return;
    }

    if (items.length === 0) {
      setSubmitError("Tu carrito esta vacio.");
      console.warn("[CheckoutModal] empty cart");
      return;
    }

    const whatsappNumber = resolveCompanyWhatsappNumber(companyInfo);
    console.log("[CheckoutModal] resolved whatsappNumber", whatsappNumber);

    if (!whatsappNumber) {
      setSubmitError("No hay un numero de WhatsApp valido configurado para Dima.");
      return;
    }

    const message = buildWhatsAppCheckoutMessage({
      items,
      values,
      origin: window.location.origin,
    });
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    console.log("[CheckoutModal] whatsappUrl", whatsappUrl);

    const popup = window.open("about:blank", "_blank", "noopener,noreferrer");
    console.log("[CheckoutModal] popup created", popup);

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const payload = buildCheckoutPayload({
        items,
        values,
        origin: window.location.origin,
        whatsappNumber,
        whatsappUrl,
      });
      console.log("[CheckoutModal] createCheckoutPedido payload", payload);

      await createCheckoutPedido(payload);
      console.log("[CheckoutModal] createCheckoutPedido success");

      if (popup) {
        popup.opener = null;
        popup.location.href = whatsappUrl;
      } else {
        console.warn("[CheckoutModal] popup blocked, falling back to same-tab redirect");
        window.location.assign(whatsappUrl);
      }

      onCheckoutSuccess();
    } catch (error: unknown) {
      console.error("[CheckoutModal] createCheckoutPedido failed", error);
      if (popup && !popup.closed) {
        popup.close();
      }
      setSubmitError(
        "No pudimos registrar tu pedido en este momento. Intenta nuevamente en unos segundos.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar checkout"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(11,20,40,0.52)] backdrop-blur-[2px]"
      />

      <div className="relative z-10 max-h-[92vh] w-full max-w-[1080px] overflow-hidden rounded-[28px] bg-[var(--dima-page)] shadow-[0_32px_80px_rgba(10,24,58,0.3)]">
        <div className="flex items-center justify-between border-b border-[var(--dima-line)] px-5 py-4 sm:px-7">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--dima-primary)]">
              Pedido por WhatsApp
            </p>
            <h2 className="mt-1 text-[24px] font-bold text-[var(--dima-ink)]">
              Completa tus datos
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--dima-line)] text-[var(--dima-ink-soft)] transition hover:bg-white"
            aria-label="Cerrar modal"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="grid max-h-[calc(92vh-82px)] gap-0 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="name"
                label="Nombre"
                value={values.name}
                required
                error={fieldErrors.name}
                placeholder="Nombre completo"
                onChange={(value) => updateValue("name", value)}
              />

              <label className="block">
                <FieldLabel label="Teléfono" required />
                <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3">
                  <div>
                    <input
                      id="phonePrefix"
                      list="checkout-phone-prefixes"
                      value={values.phonePrefix}
                      onChange={(event) =>
                        updateValue("phonePrefix", normalizePhonePrefix(event.target.value))
                      }
                      className={`w-full rounded-[18px] border bg-white px-4 py-3 text-[14px] text-[var(--dima-ink)] outline-none transition ${
                        fieldErrors.phonePrefix
                          ? "border-[#D55643] focus:border-[#D55643]"
                          : "border-[var(--dima-line)] focus:border-[var(--dima-primary)]"
                      }`}
                    />
                    <datalist id="checkout-phone-prefixes">
                      {PHONE_PREFIX_SUGGESTIONS.map((prefix) => (
                        <option key={prefix} value={prefix} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <input
                      id="phone"
                      inputMode="numeric"
                      value={values.phone}
                      onChange={(event) =>
                        updateValue("phone", event.target.value.replace(/[^\d\s-]/g, ""))
                      }
                      placeholder="Número de teléfono"
                      className={`w-full rounded-[18px] border bg-white px-4 py-3 text-[14px] text-[var(--dima-ink)] outline-none transition placeholder:text-[var(--dima-ink-soft)] ${
                        fieldErrors.phone
                          ? "border-[#D55643] focus:border-[#D55643]"
                          : "border-[var(--dima-line)] focus:border-[var(--dima-primary)]"
                      }`}
                    />
                  </div>
                </div>
                {fieldErrors.phonePrefix || fieldErrors.phone ? (
                  <p className="mt-1 text-[12px] text-[#D55643]">
                    {fieldErrors.phonePrefix || fieldErrors.phone}
                  </p>
                ) : (
                  <p className="mt-1 text-[12px] text-[var(--dima-ink-soft)]">
                    Formato actual: {fullPhoneNumber}
                  </p>
                )}
              </label>

              <FormField
                id="city"
                label="Ciudad"
                value={values.city}
                required
                error={fieldErrors.city}
                placeholder="Ciudad"
                onChange={(value) => updateValue("city", value)}
              />

              <FormField
                id="address"
                label="Dirección"
                value={values.address}
                required
                error={fieldErrors.address}
                placeholder="Dirección de entrega"
                onChange={(value) => updateValue("address", value)}
              />

              <div className="sm:col-span-2">
                <label className="block">
                  <FieldLabel label="Ubicación en mapa" />
                  <div className="rounded-[22px] border border-[var(--dima-line)] bg-white p-3">
                    <div className="flex flex-col gap-3 lg:flex-row">
                      <input
                        id="location"
                        value={values.location}
                        placeholder="Pega un enlace de Google Maps o escribe una referencia"
                        onChange={(event) => updateValue("location", event.target.value)}
                        className="min-w-0 flex-1 rounded-[16px] border border-[var(--dima-line)] bg-white px-4 py-3 text-[14px] text-[var(--dima-ink)] outline-none transition placeholder:text-[var(--dima-ink-soft)] focus:border-[var(--dima-primary)]"
                      />
                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        disabled={isLocatingUser}
                        className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-[var(--dima-line)] bg-[var(--dima-surface-soft)] px-5 text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--dima-primary)] transition hover:border-[var(--dima-primary)] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isLocatingUser ? <SpinnerIcon /> : <PinIcon />}
                        {isLocatingUser ? "Buscando..." : "Usar mi ubicación"}
                      </button>
                    </div>

                    <div className="mt-3 overflow-hidden rounded-[18px] border border-[var(--dima-line)] bg-[var(--dima-surface-soft)]">
                      <div className="flex items-center justify-between border-b border-[var(--dima-line)] px-4 py-2 text-[12px] text-[var(--dima-ink-soft)]">
                        <span>Vista previa del mapa</span>
                        {isResolvingMap ? (
                          <span className="inline-flex items-center gap-2">
                            <SpinnerIcon />
                            Actualizando...
                          </span>
                        ) : null}
                      </div>
                      <iframe
                        src={mapEmbedSrc}
                        title="Vista previa de ubicación"
                        className="h-[220px] w-full border-0"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        allowFullScreen
                      />
                    </div>
                  </div>
                </label>
              </div>

              <FormField
                id="nit"
                label="NIT"
                value={values.nit}
                placeholder="NIT"
                onChange={(value) => updateValue("nit", value)}
              />

              <FormField
                id="razonSocial"
                label="Razón Social"
                value={values.razonSocial}
                placeholder="Razón social"
                onChange={(value) => updateValue("razonSocial", value)}
              />

              <div className="sm:col-span-2">
                <FormField
                  id="notes"
                  label="Notas"
                  value={values.notes}
                  multiline
                  placeholder="Instrucciones adicionales para el equipo comercial"
                  onChange={(value) => updateValue("notes", value)}
                />
              </div>
            </div>

            {submitError ? (
              <div className="rounded-[18px] border border-[#E4A197] bg-[#FFF3F1] px-4 py-3 text-[13px] text-[#A53D2B]">
                {submitError}
              </div>
            ) : null}

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleSubmit()}
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[var(--dima-primary)] px-5 text-[13px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[var(--dima-primary-strong)] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? "Registrando pedido..." : "Enviar pedido por WhatsApp"}
            </button>
          </div>

          <aside className="border-t border-[var(--dima-line)] bg-white/80 px-5 py-5 lg:border-l lg:border-t-0">
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--dima-primary)]">
              Resumen
            </p>
            <div className="mt-4 space-y-3 rounded-[22px] border border-[var(--dima-line)] bg-white p-4">
              <div className="flex items-center justify-between text-[14px] text-[var(--dima-ink-soft)]">
                <span>Productos</span>
                <strong className="text-[var(--dima-ink)]">{totals.totalQuantity}</strong>
              </div>
              <div className="flex items-center justify-between text-[14px] text-[var(--dima-ink-soft)]">
                <span>Productos únicos</span>
                <strong className="text-[var(--dima-ink)]">{totals.uniqueItemsCount}</strong>
              </div>
              <div className="flex items-center justify-between text-[14px] text-[var(--dima-ink-soft)]">
                <span>Total estimado</span>
                <strong className="text-[var(--dima-ink)]">
                  {totals.hasPricedItems ? formatCurrency(totals.subtotal) : "Consultar precio"}
                </strong>
              </div>
            </div>

            {totals.hasUnpricedItems ? (
              <p className="mt-4 rounded-[18px] bg-[var(--dima-surface-soft)] px-4 py-3 text-[13px] leading-relaxed text-[var(--dima-ink-soft)]">
                Este carrito incluye {totals.unpricedItemsCount} producto(s) sin precio. El
                total final sera confirmado por el equipo comercial.
              </p>
            ) : null}

            <div className="mt-5 rounded-[22px] border border-[var(--dima-line)] bg-[var(--dima-page)] p-4">
              <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--dima-ink-soft)]">
                Lo que guardaremos
              </p>
              <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-[var(--dima-ink-soft)]">
                <li>Datos del cliente y teléfono completo</li>
                <li>Ubicación y dirección de entrega</li>
                <li>Detalle completo del carrito</li>
                <li>Estado inicial del pedido como pendiente</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
