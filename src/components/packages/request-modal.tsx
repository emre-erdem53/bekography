"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import {
  useCartStore,
  type CartItem,
  type CartItemInput,
} from "@/stores/cart-store";
import { PAYMENT_TYPE_LABELS, formatPrice } from "@/lib/constants";
import {
  buildRequestWhatsAppMessage,
  buildWhatsAppUrl,
} from "@/lib/whatsapp";

type RequestModalProps = {
  open: boolean;
  onClose: () => void;
  itemsOverride?: CartItemInput[];
  clearCartOnSuccess?: boolean;
};

type CategoryFields = Record<string, { shootDate: string; city: string }>;
type PaymentFields = Record<string, "pesin" | "taksitli">;

export function RequestModal({
  open,
  onClose,
  itemsOverride,
  clearCartOnSuccess = true,
}: RequestModalProps) {
  const cartItems = useCartStore((state) => state.getSelectedItems());
  const clearCart = useCartStore((state) => state.clearCart);

  const items: CartItem[] = useMemo(() => {
    if (itemsOverride?.length) {
      return itemsOverride.map((item) => ({
        ...item,
        selected: item.selected ?? true,
      }));
    }
    return cartItems;
  }, [itemsOverride, cartItems]);

  const categories = useMemo(() => {
    const map = new Map<
      string,
      { categoryId: string; dateLabel: string; cityLabel: string }
    >();
    for (const item of items) {
      if (!map.has(item.categoryId)) {
        map.set(item.categoryId, {
          categoryId: item.categoryId,
          dateLabel: item.dateLabel,
          cityLabel: item.cityLabel,
        });
      }
    }
    return [...map.values()];
  }, [items]);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [categoryFields, setCategoryFields] = useState<CategoryFields>({});
  const [paymentFields, setPaymentFields] = useState<PaymentFields>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setPaymentFields((prev) => {
      const next = { ...prev };
      for (const item of items) {
        if (!next[item.packageOptionId]) {
          next[item.packageOptionId] = "pesin";
        }
      }
      return next;
    });
  }, [open, items]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const payloadItems = items.map((item) => {
      const category = categoryFields[item.categoryId];
      const paymentType = paymentFields[item.packageOptionId] ?? "pesin";
      return {
        packageOptionId: item.packageOptionId,
        paymentType,
        shootDate: category?.shootDate ?? "",
        city: category?.city ?? "",
      };
    });

    const response = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName,
        customerPhone,
        items: payloadItems,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Talep oluşturulamadı");
      return;
    }

    const message = buildRequestWhatsAppMessage(
      customerName,
      items.map((item) => ({
        categoryTitle: item.categoryTitle,
        optionLabel: item.optionLabel,
        paymentType: paymentFields[item.packageOptionId] ?? "pesin",
      })),
    );

    setSuccess(true);
    if (clearCartOnSuccess) clearCart();
    window.open(buildWhatsAppUrl(message), "_blank", "noopener,noreferrer");
  }

  function handleClose() {
    setSuccess(false);
    setError("");
    onClose();
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-white/10 bg-[#111] p-6 sm:rounded-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Talep Oluştur</h2>
              <button
                type="button"
                onClick={handleClose}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {success ? (
              <div className="mt-6 space-y-3 text-sm text-zinc-300">
                <p>Talebiniz başarıyla oluşturuldu.</p>
                <p>
                  WhatsApp üzerinden mesajınızı göndererek iletişime geçebilirsiniz.
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-4 w-full rounded-xl bg-white py-3 text-sm font-semibold text-black"
                >
                  Tamam
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <Field label="Ad Soyad">
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className={inputClass}
                  />
                </Field>
                <Field label="Telefon">
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                    className={inputClass}
                  />
                </Field>

                {categories.map((category) => (
                  <div
                    key={category.categoryId}
                    className="space-y-3 rounded-xl border border-white/10 bg-black/40 p-4"
                  >
                    <Field label={category.cityLabel}>
                      <input
                        value={categoryFields[category.categoryId]?.city ?? ""}
                        onChange={(e) =>
                          setCategoryFields((prev) => ({
                            ...prev,
                            [category.categoryId]: {
                              shootDate:
                                prev[category.categoryId]?.shootDate ?? "",
                              city: e.target.value,
                            },
                          }))
                        }
                        required
                        className={inputClass}
                      />
                    </Field>
                    <Field label={category.dateLabel}>
                      <input
                        type="date"
                        value={categoryFields[category.categoryId]?.shootDate ?? ""}
                        onChange={(e) =>
                          setCategoryFields((prev) => ({
                            ...prev,
                            [category.categoryId]: {
                              city: prev[category.categoryId]?.city ?? "",
                              shootDate: e.target.value,
                            },
                          }))
                        }
                        required
                        className={inputClass}
                      />
                    </Field>
                  </div>
                ))}

                <div className="space-y-3">
                  <p className="text-sm font-medium text-white">Ödeme Tipi</p>
                  {items.map((item) => {
                    const paymentType =
                      paymentFields[item.packageOptionId] ?? "pesin";
                    const price =
                      paymentType === "pesin"
                        ? item.cashPrice
                        : item.installmentPrice;

                    return (
                      <div
                        key={item.packageOptionId}
                        className="rounded-xl border border-white/10 bg-black/40 p-4"
                      >
                        <p className="text-sm font-medium text-white">
                          {item.categoryTitle} — {item.optionLabel}
                        </p>
                        <div className="mt-3 flex gap-2">
                          {(["pesin", "taksitli"] as const).map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() =>
                                setPaymentFields((prev) => ({
                                  ...prev,
                                  [item.packageOptionId]: type,
                                }))
                              }
                              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium ${
                                paymentType === type
                                  ? "border-white bg-white text-black"
                                  : "border-white/20 text-zinc-400"
                              }`}
                            >
                              {PAYMENT_TYPE_LABELS[type]}
                            </button>
                          ))}
                        </div>
                        <p className="mt-2 text-sm text-zinc-400">
                          {formatPrice(price)}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {error ? <p className="text-sm text-red-400">{error}</p> : null}

                <button
                  type="submit"
                  disabled={loading || items.length === 0}
                  className="w-full rounded-xl bg-[#93f8b6] py-3 text-sm font-semibold text-black disabled:opacity-50"
                >
                  {loading ? "Gönderiliyor..." : "Talep Oluştur"}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-zinc-400">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-3 text-white outline-none focus:border-white/30";
