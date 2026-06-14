"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  dateFnsLocalizer,
  type Event as CalendarEvent,
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

export function CalendarAdminClient() {
  const router = useRouter();
  const [events, setEvents] = useState<ReservationEvent[]>([]);
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Takvimim</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Rezervasyonları takvimde görüntüleyin
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/admin/rezervasyonlar/yeni")}
          className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black"
        >
          Yeni Rezervasyon
        </button>
      </div>

      {loading ? (
        <p className="text-zinc-400">Yükleniyor...</p>
      ) : (
        <div className="admin-calendar overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f0f] p-4">
          <Calendar
            localizer={localizer}
            culture="tr"
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 650 }}
            date={date}
            onNavigate={setDate}
            messages={messages}
            onSelectEvent={(event) =>
              router.push(
                `/admin/rezervasyonlar/${(event as ReservationEvent).resource.reservationId}`,
              )
            }
            eventPropGetter={() => ({
              style: {
                backgroundColor: "#ffffff",
                color: "#000000",
                border: "none",
                borderRadius: "8px",
              },
            })}
          />
        </div>
      )}
    </div>
  );
}
