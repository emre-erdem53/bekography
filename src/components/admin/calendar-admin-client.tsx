"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  dateFnsLocalizer,
  type Event as CalendarEvent,
  type View,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { tr } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { tr };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

type ReservationEvent = CalendarEvent & {
  id: string;
  resource: {
    reservationId: string;
    item: unknown;
  };
};

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [breakpoint]);

  return isMobile;
}

export function CalendarAdminClient() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [events, setEvents] = useState<ReservationEvent[]>([]);
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<View>("month");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setView(isMobile ? "agenda" : "month");
  }, [isMobile]);

  const loadEvents = useCallback(async (currentDate: Date) => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const response = await fetch(
      `/api/admin/calendar?start=${start.toISOString()}&end=${end.toISOString()}`,
    );
    const data = await response.json();

    setEvents(
      data.map(
        (event: {
          id: string;
          title: string;
          start: string;
          end: string;
          resource: ReservationEvent["resource"];
        }) => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end),
        }),
      ),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    loadEvents(date);
  }, [date, loadEvents]);

  const messages = useMemo(
    () => ({
      today: "Bugün",
      previous: "Önceki",
      next: "Sonraki",
      month: "Ay",
      week: "Hafta",
      day: "Gün",
      agenda: "Ajanda",
      date: "Tarih",
      time: "Saat",
      event: "Rezervasyon",
      noEventsInRange: "Bu aralıkta rezervasyon yok.",
    }),
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white sm:text-2xl">Takvimim</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Rezervasyonları takvimde görüntüleyin
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/admin/rezervasyonlar/yeni")}
          className="w-full rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black sm:w-auto"
        >
          Yeni Rezervasyon
        </button>
      </div>

      {loading ? (
        <p className="text-zinc-400">Yükleniyor...</p>
      ) : (
        <div className="admin-calendar overflow-hidden rounded-2xl border border-zinc-800 bg-[#0a0a0a] p-3 sm:p-5">
          <div className="h-[min(72vh,680px)] min-h-[440px]">
            <Calendar
              localizer={localizer}
              culture="tr"
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: "100%" }}
              date={date}
              view={view}
              onView={setView}
              onNavigate={setDate}
              messages={messages}
              views={isMobile ? ["agenda", "month"] : undefined}
              onSelectEvent={(event) =>
                router.push(
                  `/admin/rezervasyonlar/${(event as ReservationEvent).resource.reservationId}`,
                )
              }
              eventPropGetter={() => ({
                style: {
                  backgroundColor: "#f4f4f5",
                  color: "#18181b",
                  border: "1px solid #d4d4d8",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  padding: "1px 6px",
                },
              })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
