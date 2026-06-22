"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { tr } from "date-fns/locale";
import { ChevronLeft, Plus } from "lucide-react";
import { formatCoupleName } from "@/lib/reservation-utils";

const WEEKDAYS_TR = ["P", "S", "Ç", "P", "C", "C", "P"] as const;
const MONTHS_BACK = 6;
const MONTHS_FORWARD = 18;

type CalendarReservationEvent = {
  id: string;
  title: string;
  start: Date;
  reservationId: string;
  categoryTitle: string;
  coupleName: string;
  accentColor: string;
};

type ApiCalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  resource: {
    reservationId: string;
    item: {
      packageOption: {
        category: { title: string; accentColor: string };
      };
      reservation: { brideName: string; groomName: string };
    };
  };
};

type CalendarView = "months" | "day";

function capitalizeMonth(date: Date) {
  const label = format(date, "LLLL", { locale: tr });
  return label.charAt(0).toLocaleUpperCase("tr-TR") + label.slice(1);
}

function monthKey(date: Date) {
  return format(date, "yyyy-MM");
}

function dayKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function buildMonthDays(monthDate: Date) {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  return eachDayOfInterval({ start: gridStart, end: gridEnd });
}

function parseCalendarEvents(data: ApiCalendarEvent[]): CalendarReservationEvent[] {
  return data.map((event) => {
    const item = event.resource.item;
    return {
      id: event.id,
      title: event.title,
      start: new Date(event.start),
      reservationId: event.resource.reservationId,
      categoryTitle: item.packageOption.category.title,
      coupleName: formatCoupleName(
        item.reservation.brideName,
        item.reservation.groomName,
      ),
      accentColor: item.packageOption.category.accentColor || "#93f8b6",
    };
  });
}

function DayIndicators({ events }: { events: CalendarReservationEvent[] }) {
  if (events.length === 0) return <span className="mt-1 block h-1.5" aria-hidden />;

  return (
    <div className="mt-1 flex h-1.5 items-center justify-center gap-0.5 px-0.5">
      {events.slice(0, 3).map((event) => (
        <span
          key={event.id}
          className="h-1 w-3 rounded-full"
          style={{ backgroundColor: event.accentColor }}
        />
      ))}
      {events.length > 3 ? (
        <span className="h-1 w-1 rounded-full bg-zinc-500" />
      ) : null}
    </div>
  );
}

function MonthGrid({
  monthDate,
  eventsByDay,
  onSelectDay,
}: {
  monthDate: Date;
  eventsByDay: Map<string, CalendarReservationEvent[]>;
  onSelectDay: (date: Date) => void;
}) {
  const days = buildMonthDays(monthDate);

  return (
    <section className="pb-8">
      <h2 className="px-4 pb-2 pt-6 text-[2rem] font-bold leading-none text-white">
        {capitalizeMonth(monthDate)}
      </h2>

      <div className="grid grid-cols-7 px-3 pb-1">
        {WEEKDAYS_TR.map((label, index) => (
          <div
            key={`${monthKey(monthDate)}-${label}-${index}`}
            className="py-2 text-center text-[11px] font-medium uppercase text-zinc-500"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 px-3">
        {days.map((day) => {
          const inMonth = isSameMonth(day, monthDate);
          const events = eventsByDay.get(dayKey(day)) ?? [];
          const today = isToday(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDay(day)}
              className={`flex min-h-[52px] flex-col items-center rounded-lg py-1.5 transition-colors hover:bg-white/5 ${
                inMonth ? "text-white" : "text-zinc-600"
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-[15px] leading-none ${
                  today ? "bg-red-500 font-semibold text-white" : ""
                }`}
              >
                {format(day, "d")}
              </span>
              {inMonth ? <DayIndicators events={events} /> : <span className="mt-1 block h-1.5" />}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function DayView({
  date,
  events,
  onBack,
  onNewReservation,
  onOpenReservation,
  onToday,
}: {
  date: Date;
  events: CalendarReservationEvent[];
  onBack: () => void;
  onNewReservation: () => void;
  onOpenReservation: (reservationId: string) => void;
  onToday: () => void;
}) {
  return (
    <div className="flex min-h-[min(72vh,720px)] flex-col">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm font-medium text-red-400"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {capitalizeMonth(date)}
        </button>
        <button
          type="button"
          onClick={onNewReservation}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-white"
          aria-label="Yeni rezervasyon"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <div className="border-b border-zinc-800 px-4 py-4">
        <p className="text-3xl font-bold text-white">
          {format(date, "d MMMM yyyy", { locale: tr })}
        </p>
        <p className="mt-1 text-sm capitalize text-zinc-400">
          {format(date, "EEEE", { locale: tr })}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {events.length === 0 ? (
          <p className="px-4 py-8 text-sm text-zinc-500">
            Bu gün için rezervasyon yok.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {events.map((event) => (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => onOpenReservation(event.reservationId)}
                  className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-white/[0.03]"
                >
                  <span
                    className="mt-1 h-10 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: event.accentColor }}
                  />
                  <span className="min-w-0">
                    <span className="block font-semibold text-white">
                      {event.coupleName}
                    </span>
                    <span className="mt-0.5 block text-sm text-zinc-400">
                      {event.categoryTitle}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-zinc-800 px-4 py-3">
        <button
          type="button"
          onClick={onToday}
          className="rounded-full bg-zinc-800 px-4 py-2 text-sm font-medium text-red-400"
        >
          Bugün
        </button>
      </div>
    </div>
  );
}

export function CalendarAdminClient() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const monthRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [events, setEvents] = useState<CalendarReservationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<CalendarView>("months");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [visibleYear, setVisibleYear] = useState(new Date().getFullYear());

  const months = useMemo(() => {
    const anchor = startOfMonth(new Date());
    const list: Date[] = [];
    for (let offset = -MONTHS_BACK; offset <= MONTHS_FORWARD; offset += 1) {
      list.push(addMonths(anchor, offset));
    }
    return list;
  }, []);

  const loadEvents = useCallback(async () => {
    const rangeStart = startOfMonth(addMonths(new Date(), -MONTHS_BACK));
    const rangeEnd = endOfMonth(addMonths(new Date(), MONTHS_FORWARD));

    const response = await fetch(
      `/api/admin/calendar?start=${rangeStart.toISOString()}&end=${rangeEnd.toISOString()}`,
    );
    const data = await response.json();
    setEvents(parseCalendarEvents(data));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    const currentKey = monthKey(startOfMonth(new Date()));
    const node = monthRefs.current.get(currentKey);
    if (!node || view !== "months") return;

    const frame = requestAnimationFrame(() => {
      node.scrollIntoView({ block: "start" });
    });

    return () => cancelAnimationFrame(frame);
  }, [loading, view]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || view !== "months") return;

    const handleScroll = () => {
      const containerTop = container.getBoundingClientRect().top;
      let closestKey: string | undefined;
      let closestDistance = Number.POSITIVE_INFINITY;

      monthRefs.current.forEach((node, key) => {
        const distance = Math.abs(node.getBoundingClientRect().top - containerTop - 12);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestKey = key;
        }
      });

      if (typeof closestKey === "string") {
        const year = Number(closestKey.split("-")[0]);
        if (!Number.isNaN(year)) setVisibleYear(year);
      }
    };

    handleScroll();
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [view, months.length]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarReservationEvent[]>();
    for (const event of events) {
      const key = dayKey(event.start);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const selectedDayEvents = useMemo(() => {
    return eventsByDay.get(dayKey(selectedDate)) ?? [];
  }, [eventsByDay, selectedDate]);

  function openDay(date: Date) {
    setSelectedDate(date);
    setView("day");
  }

  function scrollToMonth(date: Date) {
    const key = monthKey(startOfMonth(date));
    const node = monthRefs.current.get(key);
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setVisibleYear(date.getFullYear());
  }

  function goToToday() {
    const today = new Date();
    setSelectedDate(today);
    if (view === "day") return;
    scrollToMonth(today);
  }

  function openNewReservation(date: Date) {
    router.push(`/admin/rezervasyonlar/yeni?date=${dayKey(date)}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white sm:text-2xl">Takvimim</h1>
          <p className="mt-1 text-sm text-zinc-400">
            iPhone Takvimi benzeri görünüm — ayları kaydırın, güne dokunun
          </p>
        </div>
        {view === "months" ? (
          <button
            type="button"
            onClick={() => openNewReservation(new Date())}
            className="hidden rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black sm:inline-flex"
          >
            Yeni Rezervasyon
          </button>
        ) : null}
      </div>

      {loading ? (
        <p className="text-zinc-400">Yükleniyor...</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-black">
          {view === "months" ? (
            <>
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800 bg-black/95 px-4 py-3 backdrop-blur-md">
                <span className="text-sm font-medium text-red-400">{visibleYear}</span>
                <button
                  type="button"
                  onClick={goToToday}
                  className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-red-400"
                >
                  Bugün
                </button>
              </div>

              <div
                ref={scrollRef}
                className="h-[min(72vh,720px)] overflow-y-auto overscroll-contain"
              >
                {months.map((monthDate) => {
                  const key = monthKey(monthDate);
                  return (
                    <div
                      key={key}
                      ref={(node) => {
                        if (node) monthRefs.current.set(key, node);
                        else monthRefs.current.delete(key);
                      }}
                    >
                      <MonthGrid
                        monthDate={monthDate}
                        eventsByDay={eventsByDay}
                        onSelectDay={openDay}
                      />
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <DayView
              date={selectedDate}
              events={selectedDayEvents}
              onBack={() => setView("months")}
              onNewReservation={() => openNewReservation(selectedDate)}
              onOpenReservation={(reservationId) =>
                router.push(`/admin/rezervasyonlar/${reservationId}`)
              }
              onToday={() => {
                const today = new Date();
                setSelectedDate(today);
                setView("day");
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
