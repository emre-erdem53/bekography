"use client";

import { FormEvent, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import {
  buildRequestWhatsAppMessage,
  buildWhatsAppUrl,
} from "@/lib/whatsapp";

type RequestModalProps = {
  open: boolean;
  onClose: () => void;
};

export function RequestModal({ open, onClose }: RequestModalProps) {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [city, setCity] = useState("");
  const [shootDate, setShootDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName,
        customerPhone,
        city,
        shootDate,
        items: items.map((item) => ({
          packageOptionId: item.packageOptionId,
          paymentType: item.paymentType,
        })),
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
        paymentType: item.paymentType,
      })),
    );

    setSuccess(true);
    clearCart();
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
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111] p-6"
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
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                <Field label="Çekimin Yapılacağı Şehir">
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    className={inputClass}
                  />
                </Field>
                <Field label="Çekimin Yapılacağı Tarih">
                  <input
                    type="date"
                    value={shootDate}
                    onChange={(e) => setShootDate(e.target.value)}
                    required
                    className={inputClass}
                  />
                </Field>

                {error ? <p className="text-sm text-red-400">{error}</p> : null}

                <button
                  type="submit"
                  disabled={loading || items.length === 0}
                  className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-black disabled:opacity-50"
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
