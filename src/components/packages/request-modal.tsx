"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import {
  useCartStore,
  type CartItem,
  type CartItemInput,
} from "@/stores/cart-store";
import {
  DEFAULT_REQUEST_CITY,
  REQUEST_CITY_OPTIONS,
} from "@/lib/turkish-provinces";
import { PaymentTypeOptionButton } from "@/components/packages/payment-type-price";
import {
  RequestActionLabel,
  requestActionSurfaceClassFull,
} from "@/components/packages/request-action-label";
import {
  buildRequestWhatsAppMessage,
  buildWhatsAppUrl,
} from "@/lib/whatsapp";
import {
  canCreateRequestForItems,
  getCompanionRequirementMessage,
} from "@/lib/cart-companion-rules";
import { PersonNameInput } from "@/components/forms/person-name-input";

type RequestModalProps = {
  open: boolean;
  onClose: () => void;
  itemsOverride?: CartItemInput[];
};

type ServiceAreaFields = Record<string, { shootDate: string; city: string }>;

const emptyForm = {
  contactFirstName: "",
  contactLastName: "",
  contactRole: null as "gelin" | "damat" | null,
};

function buildDefaultServiceAreaFields(
  serviceAreaIds: string[],
): ServiceAreaFields {
  return Object.fromEntries(
    serviceAreaIds.map((serviceAreaId) => [
      serviceAreaId,
      { city: DEFAULT_REQUEST_CITY, shootDate: "" },
    ]),
  );
}

function CityPicker({
  value,
  onChange,
  required,
}: {
  value: string;
  onChange: (city: string) => void;
  required?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const displayValue = value.trim() || DEFAULT_REQUEST_CITY;

  if (!editing) {
    return (
      <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-3">
        <span className="min-w-0 flex-1 truncate text-white">{displayValue}</span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="shrink-0 text-sm font-medium text-[#93f8b6] hover:text-[#b8ffd0]"
        >
          Değiştir
        </button>
      </div>
    );
  }

  return (
    <select
      value={displayValue}
      onChange={(event) => {
        onChange(event.target.value);
        setEditing(false);
      }}
      required={required}
      autoFocus
      className={inputClass}
    >
      {REQUEST_CITY_OPTIONS.map((province) => (
        <option key={province} value={province}>
          {province}
        </option>
      ))}
    </select>
  );
}

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
    () => items.map((item) => item.shootTypeId).join(","),
    [items],
  );

  /** Tarih ve şehir hizmet alanı başına bir kez sorulur. */
  const serviceAreaGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        serviceAreaId: string;
        dateLabel: string;
        cityLabel: string;
        title: string;
      }
    >();
    for (const item of items) {
      if (!map.has(item.serviceAreaId)) {
        map.set(item.serviceAreaId, {
          serviceAreaId: item.serviceAreaId,
          dateLabel: item.dateLabel,
          cityLabel: item.cityLabel,
          title: `${item.serviceAreaTitle} · ${item.packageTitle}`,
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
  const hasMultipleItems = items.length > 1;

  const [contactFirstName, setContactFirstName] = useState("");
  const [contactLastName, setContactLastName] = useState("");
  const [contactRole, setContactRole] = useState<"gelin" | "damat" | null>(
    null,
  );
  const [serviceAreaFields, setServiceAreaFields] =
    useState<ServiceAreaFields>({});
  const [sameDay, setSameDay] = useState(false);
  const [sameCity, setSameCity] = useState(false);
  const [globalShootDate, setGlobalShootDate] = useState("");
  const [globalCity, setGlobalCity] = useState(DEFAULT_REQUEST_CITY);
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
    setSameDay(false);
    setSameCity(false);
    setGlobalShootDate("");
    setGlobalCity(DEFAULT_REQUEST_CITY);
    setServiceAreaFields(
      buildDefaultServiceAreaFields(
        serviceAreaGroups.map((group) => group.serviceAreaId),
      ),
    );
  }, [open, itemIdsKey, serviceAreaGroups]);

  function resetForm() {
    setContactFirstName(emptyForm.contactFirstName);
    setContactLastName(emptyForm.contactLastName);
    setContactRole(emptyForm.contactRole);
    setServiceAreaFields({});
    setSameDay(false);
    setSameCity(false);
    setGlobalShootDate("");
    setGlobalCity(DEFAULT_REQUEST_CITY);
    setPaymentType("pesin");
    setError("");
    setSuccess(false);
  }

  function resolveServiceAreaFields(): ServiceAreaFields {
    const resolved = { ...serviceAreaFields };

    for (const group of serviceAreaGroups) {
      const current = resolved[group.serviceAreaId] ?? {
        city: DEFAULT_REQUEST_CITY,
        shootDate: "",
      };
      resolved[group.serviceAreaId] = {
        city:
          hasMultipleItems && sameCity
            ? globalCity.trim() || DEFAULT_REQUEST_CITY
            : current.city.trim() || DEFAULT_REQUEST_CITY,
        shootDate:
          hasMultipleItems && sameDay ? globalShootDate : current.shootDate,
      };
    }

    return resolved;
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

    const resolvedFields = resolveServiceAreaFields();

    const missingGroup = serviceAreaGroups.find((group) => {
      const fields = resolvedFields[group.serviceAreaId];
      return !fields?.city?.trim() || !fields?.shootDate;
    });

    if (missingGroup) {
      setLoading(false);
      setError(`${missingGroup.title} için tarih ve şehir bilgisi zorunludur.`);
      return;
    }

    if (!contactRole) {
      setLoading(false);
      setError("Gelin veya damat seçin.");
      return;
    }

    const payloadItems = items.map((item) => {
      const fields = resolvedFields[item.serviceAreaId]!;
      return {
        shootTypeId: item.shootTypeId,
        paymentType,
        shootDate: fields.shootDate,
        city: fields.city.trim(),
      };
    });

    const response = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactFirstName: contactFirstName.trim(),
        contactLastName: contactLastName.trim(),
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
      const fields = resolvedFields[item.serviceAreaId]!;
      return {
        categoryTitle: `${item.serviceAreaTitle} · ${item.packageTitle}`,
        optionLabel: item.shootTypeLabel,
        shootDate: fields.shootDate,
        city: fields.city.trim(),
      };
    });

    const message = buildRequestWhatsAppMessage(
      contactFirstName.trim(),
      contactLastName.trim(),
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
            className="max-h-[90vh] w-full min-w-0 max-w-lg overflow-x-hidden overflow-y-auto overscroll-contain rounded-t-2xl border border-white/10 bg-[#111] p-6 sm:max-w-xl sm:rounded-2xl lg:max-w-2xl"
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
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Ad" required>
                        <PersonNameInput
                          value={contactFirstName}
                          onChange={setContactFirstName}
                          required
                          autoComplete="given-name"
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Soyad" required>
                        <PersonNameInput
                          value={contactLastName}
                          onChange={setContactLastName}
                          required
                          autoComplete="family-name"
                          className={inputClass}
                        />
                      </Field>
                    </div>
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

                {hasMultipleItems ? (
                  <FormSection title="Çekim Bilgileri">
                    <div className="flex flex-wrap gap-2">
                      <ToggleChip
                        active={sameDay}
                        onClick={() => setSameDay((value) => !value)}
                        label="Tümü Aynı Gün"
                      />
                      <ToggleChip
                        active={sameCity}
                        onClick={() => setSameCity((value) => !value)}
                        label="Tümü Aynı Şehirde"
                      />
                    </div>

                    {sameDay ? (
                      <Field label="Çekim Tarihi" required>
                        <input
                          type="date"
                          value={globalShootDate}
                          onChange={(event) =>
                            setGlobalShootDate(event.target.value)
                          }
                          required
                          className={inputClass}
                        />
                      </Field>
                    ) : null}

                    {sameCity ? (
                      <Field label="Şehir" required>
                        <CityPicker
                          value={globalCity}
                          onChange={setGlobalCity}
                          required
                        />
                      </Field>
                    ) : null}
                  </FormSection>
                ) : null}

                {serviceAreaGroups.map((group) => {
                  const hideDate = hasMultipleItems && sameDay;
                  const hideCity = hasMultipleItems && sameCity;
                  if (hideDate && hideCity) return null;

                  return (
                    <FormSection key={group.serviceAreaId} title={group.title}>
                      <div className="grid-safe grid gap-4 sm:grid-cols-2">
                        {hideCity ? null : (
                          <Field label={group.cityLabel} required>
                            <CityPicker
                              value={
                                serviceAreaFields[group.serviceAreaId]?.city ??
                                DEFAULT_REQUEST_CITY
                              }
                              onChange={(city) =>
                                setServiceAreaFields((prev) => ({
                                  ...prev,
                                  [group.serviceAreaId]: {
                                    shootDate:
                                      prev[group.serviceAreaId]?.shootDate ?? "",
                                    city,
                                  },
                                }))
                              }
                              required
                            />
                          </Field>
                        )}
                        {hideDate ? null : (
                          <Field label={group.dateLabel} required>
                            <input
                              type="date"
                              value={
                                serviceAreaFields[group.serviceAreaId]
                                  ?.shootDate ?? ""
                              }
                              onChange={(e) =>
                                setServiceAreaFields((prev) => ({
                                  ...prev,
                                  [group.serviceAreaId]: {
                                    city:
                                      prev[group.serviceAreaId]?.city ??
                                      DEFAULT_REQUEST_CITY,
                                    shootDate: e.target.value,
                                  },
                                }))
                              }
                              required
                              className={inputClass}
                            />
                          </Field>
                        )}
                      </div>
                    </FormSection>
                  );
                })}

                <FormSection title="Ödeme Tipi">
                  <p className="text-xs leading-relaxed text-zinc-500">
                    Tüm paketler için geçerli olacak ödeme planını seçin.
                  </p>
                  <div className="flex min-w-0 gap-2">
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
                </FormSection>

                {!requestAllowed ? (
                  <p className="break-words rounded-xl border border-amber-400/25 bg-amber-950/50 px-4 py-3 text-sm leading-relaxed text-amber-100">
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

function ToggleChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? "border-[#93f8b6] bg-[#93f8b6] text-black"
          : "border-white/20 text-zinc-300 hover:border-white/35"
      }`}
    >
      {label}
    </button>
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
    <section className="min-w-0 space-y-3 overflow-hidden rounded-xl border border-white/10 bg-black/40 p-4">
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
    <label className="block min-w-0 space-y-1.5">
      <span className="text-sm text-zinc-400">
        {label}
        {required ? <span className="text-red-400"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "box-border w-full min-w-0 max-w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-3 text-white outline-none focus:border-white/30";
