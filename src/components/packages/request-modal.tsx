"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import {
  useCartStore,
  type CartItem,
  type CartItemInput,
} from "@/stores/cart-store";
import { formatPrice } from "@/lib/constants";
import { TURKISH_PROVINCES } from "@/lib/turkish-provinces";
import { PaymentTypeOptionButton } from "@/components/packages/payment-type-price";
import { RequestActionLabel, requestActionSurfaceClassFull } from "@/components/packages/request-action-label";
import {
  buildRequestWhatsAppMessage,
  buildWhatsAppUrl,
} from "@/lib/whatsapp";
import {
  canCreateRequestForItems,
  getCompanionRequirementMessage,
} from "@/lib/cart-companion-rules";

type RequestModalProps = {
  open: boolean;
  onClose: () => void;
  itemsOverride?: CartItemInput[];
};

type CategoryFields = Record<string, { shootDate: string; city: string }>;

const emptyForm = {
  contactName: "",
  contactRole: null as "gelin" | "damat" | null,
};

export function RequestModal({
  open,
  onClose,
  itemsOverride,
}: RequestModalProps) {
  const cartItems = useCartStore((state) => state.items);

  const selectedCartItems = useMemo(
    () => cartItems.filter((item) => item.selected),
    [cartItems],
  );

  const items: CartItem[] = useMemo(() => {
    if (itemsOverride?.length) {
      return itemsOverride.map((item) => ({
        ...item,
        selected: item.selected ?? true,
      }));
    }
    return selectedCartItems;
  }, [itemsOverride, selectedCartItems]);

  const itemIdsKey = useMemo(
    () => items.map((item) => item.packageOptionId).join(","),
    [items],
  );

  const categories = useMemo(() => {
    const map = new Map<
      string,
      { categoryId: string; dateLabel: string; cityLabel: string; title: string }
    >();
    for (const item of items) {
      if (!map.has(item.categoryId)) {
        map.set(item.categoryId, {
          categoryId: item.categoryId,
          dateLabel: item.dateLabel,
          cityLabel: item.cityLabel,
          title: item.categoryTitle,
        });
      }
    }
    return [...map.values()];
  }, [items]);

  const totalCash = useMemo(
    () => items.reduce((sum, item) => sum + item.cashPrice, 0),
    [items],
  );
  const totalInstallment = useMemo(
    () => items.reduce((sum, item) => sum + item.installmentPrice, 0),
    [items],
  );
  const requestAllowed = canCreateRequestForItems(items);

  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState<"gelin" | "damat" | null>(
    null,
  );
  const [categoryFields, setCategoryFields] = useState<CategoryFields>({});
  const [paymentType, setPaymentType] = useState<"pesin" | "taksitli">("pesin");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setPaymentType("pesin");
  }, [open, itemIdsKey]);

  function resetForm() {
    setContactName(emptyForm.contactName);
    setContactRole(emptyForm.contactRole);
    setCategoryFields({});
    setPaymentType("pesin");
    setError("");
    setSuccess(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    if (items.length === 0) {
      setLoading(false);
      setError("En az bir paket seçin.");
      return;
    }

    if (!canCreateRequestForItems(items)) {
      setLoading(false);
      setError(getCompanionRequirementMessage());
      return;
    }

    const missingCategory = categories.find((category) => {
      const fields = categoryFields[category.categoryId];
      return !fields?.city?.trim() || !fields?.shootDate;
    });

    if (missingCategory) {
      setLoading(false);
      setError(`${missingCategory.title} için tarih ve şehir bilgisi zorunludur.`);
      return;
    }

    if (!contactRole) {
      setLoading(false);
      setError("Gelin veya damat seçin.");
      return;
    }

    const payloadItems = items.map((item) => {
      const category = categoryFields[item.categoryId]!;
      return {
        packageOptionId: item.packageOptionId,
        paymentType,
        shootDate: category.shootDate,
        city: category.city.trim(),
      };
    });

    const response = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactName: contactName.trim(),
        contactRole,
        items: payloadItems,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Talep oluşturulamadı");
      return;
    }

    const whatsAppItems = items.map((item) => {
      const fields = categoryFields[item.categoryId]!;
      return {
        categoryTitle: item.categoryTitle,
        optionLabel: item.optionLabel,
        shootDate: fields.shootDate,
        city: fields.city.trim(),
      };
    });

    const message = buildRequestWhatsAppMessage(
      contactName.trim(),
      contactRole,
      whatsAppItems,
    );

    setSuccess(true);
    window.open(buildWhatsAppUrl(message), "_blank", "noopener,noreferrer");
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-end justify-center overflow-hidden bg-black/70 p-0 sm:items-center sm:p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-2xl border border-white/10 bg-[#111] p-6 sm:max-w-xl sm:rounded-2xl lg:max-w-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Talep Oluştur</h2>
              <button
                type="button"
                onClick={handleClose}
                className="text-zinc-400 hover:text-white"
                aria-label="Kapat"
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
                <FormSection title="İletişim Bilgileri">
                  <div className="space-y-4">
                    <Field label="Ad Soyad" required>
                      <input
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        required
                        minLength={2}
                        className={inputClass}
                      />
                    </Field>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-white">
                        <input
                          type="checkbox"
                          checked={contactRole === "gelin"}
                          onChange={() => setContactRole("gelin")}
                          className="h-4 w-4 accent-[#93f8b6]"
                        />
                        Gelin
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-white">
                        <input
                          type="checkbox"
                          checked={contactRole === "damat"}
                          onChange={() => setContactRole("damat")}
                          className="h-4 w-4 accent-[#93f8b6]"
                        />
                        Damat
                      </label>
                    </div>
                  </div>
                </FormSection>

                {categories.map((category) => (
                  <FormSection key={category.categoryId} title={category.title}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label={category.cityLabel} required>
                        <select
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
                        >
                          <option value="">İl seçin</option>
                          {TURKISH_PROVINCES.map((province) => (
                            <option key={province} value={province}>
                              {province}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label={category.dateLabel} required>
                        <input
                          type="date"
                          value={
                            categoryFields[category.categoryId]?.shootDate ?? ""
                          }
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
                  </FormSection>
                ))}

                <FormSection title="Ödeme Tipi">
                  <p className="text-xs leading-relaxed text-zinc-500">
                    Tüm paketler için geçerli olacak ödeme planını seçin.
                  </p>
                  <div className="flex gap-2">
                    <PaymentTypeOptionButton
                      type="pesin"
                      price={totalCash}
                      selected={paymentType === "pesin"}
                      onSelect={() => setPaymentType("pesin")}
                    />
                    <PaymentTypeOptionButton
                      type="taksitli"
                      price={totalInstallment}
                      selected={paymentType === "taksitli"}
                      onSelect={() => setPaymentType("taksitli")}
                    />
                  </div>
                  <p className="border-t border-white/10 pt-3 text-sm font-semibold text-white">
                    Toplam:{" "}
                    {formatPrice(
                      paymentType === "pesin" ? totalCash : totalInstallment,
                    )}
                  </p>
                </FormSection>

                {!requestAllowed ? (
                  <p className="rounded-xl border border-amber-400/25 bg-amber-950/50 px-4 py-3 text-sm leading-relaxed text-amber-100">
                    {getCompanionRequirementMessage()}
                  </p>
                ) : null}

                {error ? <p className="text-sm text-red-400">{error}</p> : null}

                <button
                  type="submit"
                  disabled={loading || items.length === 0 || !requestAllowed}
                  className={`${requestActionSurfaceClassFull} rounded-xl bg-[#93f8b6] py-3 text-sm font-semibold text-black disabled:opacity-50`}
                >
                  {loading ? (
                    "Gönderiliyor..."
                  ) : (
                    <RequestActionLabel>Talep Oluştur</RequestActionLabel>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-white/10 bg-black/40 p-4">
      <h3 className="text-sm font-medium text-white">{title}</h3>
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-zinc-400">
        {label}
        {required ? <span className="text-red-400"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-3 text-white outline-none focus:border-white/30";
