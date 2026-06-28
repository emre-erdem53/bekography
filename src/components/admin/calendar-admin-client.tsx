"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { tr } from "date-fns/locale";
import { ChevronLeft, Clock, Plus } from "lucide-react";
import {
  OUTDOOR_DEFAULT_ARRIVAL_TIME,
  OUTDOOR_DEFAULT_DEPARTURE_TIME,
} from "@/lib/constants";
import { formatCoupleFirstNames } from "@/lib/reservation-utils";

const WEEKDAYS_TR = ["P", "S", "Ç", "P", "C", "C", "P"] as const;
const MONTHS_BACK = 6;
const MONTHS_FORWARD = 18;
const TIMELINE_START_HOUR = 12;
const TIMELINE_END_HOUR = 22;
const TIMELINE_HOUR_HEIGHT_PX = 56;
const INDOOR_DEFAULT_START = "10:00";
const INDOOR_DEFAULT_END = "14:00";

type CalendarReservationEvent = {
  id: string;
  title: string;
  start: Date;
  reservationId: string;
  categoryTitle: string;
  optionLabel: string;
  coupleLabel: string;
  accentColor: string;
  startTime: string;
  endTime: string;
  isOutdoor: boolean;
};

type ApiCalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  resource: {
    reservationId: string;
    item: {
      shootContent: string;
      departureTime: string | null;
      arrivalTime: string | null;
      startTime: string | null;
      endTime: string | null;
      isOutdoor: boolean;
      packageOption: {
        label: string;
        category: { title: string; slug: string; accentColor: string };
      };
      reservation: {
        brideName: string;
        brideFirstName: string;
        groomName: string;
        groomFirstName: string;
      };
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
    const reservation = item.reservation;
    const category = item.packageOption.category;
    const coupleLabel = formatCoupleFirstNames(
      reservation.brideFirstName,
      reservation.brideName,
      reservation.groomFirstName,
      reservation.groomName,
    );

    return {
      id: event.id,
      title: event.title,
      start: new Date(event.start),
      reservationId: event.resource.reservationId,
      categoryTitle: category.title,
      optionLabel: item.shootContent.trim() || item.packageOption.label,
      coupleLabel,
      accentColor: category.accentColor || "#93f8b6",
      startTime: item.isOutdoor
        ? item.departureTime?.trim() || OUTDOOR_DEFAULT_DEPARTURE_TIME
        : item.startTime?.trim() || INDOOR_DEFAULT_START,
      endTime: item.isOutdoor
        ? item.arrivalTime?.trim() || OUTDOOR_DEFAULT_ARRIVAL_TIME
        : item.endTime?.trim() || INDOOR_DEFAULT_END,
      isOutdoor: item.isOutdoor,
    };
  });
}

function timeToMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function resolveEventWindow(event: CalendarReservationEvent): {
  startMin: number;
  endMin: number;
} {
  let startMin = timeToMinutes(event.startTime);
  let endMin = timeToMinutes(event.endTime);

  if (startMin === null) {
    startMin = timeToMinutes(
      event.isOutdoor ? OUTDOOR_DEFAULT_DEPARTURE_TIME : INDOOR_DEFAULT_START,
    )!;
  }
  if (endMin === null) {
    endMin = timeToMinutes(
      event.isOutdoor ? OUTDOOR_DEFAULT_ARRIVAL_TIME : INDOOR_DEFAULT_END,
    )!;
  }
  if (endMin <= startMin) {
    endMin = startMin + 60;
  }

  return { startMin, endMin };
}

function buildTimelineHours() {
  const hours: number[] = [];
  for (let hour = TIMELINE_START_HOUR; hour <= TIMELINE_END_HOUR; hour += 1) {
    hours.push(hour);
  }
  return hours;
}

function WeekDayStrip({
  selectedDate,
  onSelectDate,
}: {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(selectedDate, { weekStartsOn: 1 }),
  });

  return (
    <div className="grid grid-cols-7 px-2 pb-3 pt-2">
      {weekDays.map((day, index) => {
        const selected = isSameDay(day, selectedDate);
        const today = isToday(day);

        return (
          <button
            key={day.toISOString()}
            type="button"
            onClick={() => onSelectDate(day)}
            className="flex flex-col items-center gap-1 py-1"
          >
            <span className="text-[11px] font-medium text-zinc-500">
              {WEEKDAYS_TR[index]}
            </span>
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-[15px] leading-none ${
                selected
                  ? "bg-red-500 font-semibold text-white"
                  : today
                    ? "font-semibold text-red-400"
                    : "text-white"
              }`}
            >
              {format(day, "d")}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function DayTimeline({
  date,
  events,
  onOpenReservation,
}: {
  date: Date;
  events: CalendarReservationEvent[];
  onOpenReservation: (reservationId: string) => void;
}) {
  const [now, setNow] = useState(() => new Date());
  const timelineHours = buildTimelineHours();
  const timelineStartMin = TIMELINE_START_HOUR * 60;
  const timelineEndMin = TIMELINE_END_HOUR * 60;
  const timelineSpanMin = timelineEndMin - timelineStartMin;
  const timelineHeightPx =
    (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * TIMELINE_HOUR_HEIGHT_PX;
  const showNowIndicator = isToday(date);

  useEffect(() => {
    if (!showNowIndicator) return;
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, [showNowIndicator]);

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowTopPx =
    ((nowMinutes - timelineStartMin) / timelineSpanMin) * timelineHeightPx;
  const showNowLine =
    showNowIndicator &&
    nowMinutes >= timelineStartMin &&
    nowMinutes <= timelineEndMin;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="border-b border-zinc-800 px-4 py-3">
        <p className="text-sm font-medium capitalize text-zinc-300">
          {format(date, "d MMM yyyy", { locale: tr })} –{" "}
          {format(date, "EEEE", { locale: tr })}
        </p>
      </div>

      <div className="relative px-3 py-4 sm:px-4">
        <div className="flex gap-3">
          <div
            className="relative shrink-0 text-right text-[11px] text-zinc-500"
            style={{ width: "2.75rem", height: timelineHeightPx }}
          >
            {timelineHours.map((hour) => {
              const top =
                ((hour * 60 - timelineStartMin) / timelineSpanMin) *
                timelineHeightPx;

              return (
                <span
                  key={hour}
                  className="absolute right-0 -translate-y-1/2 leading-none"
                  style={{ top }}
                >
                  {String(hour).padStart(2, "0")}:00
                </span>
              );
            })}
          </div>

          <div
            className="relative min-w-0 flex-1"
            style={{ height: timelineHeightPx }}
          >
            {timelineHours.map((hour) => {
              const top =
                ((hour * 60 - timelineStartMin) / timelineSpanMin) *
                timelineHeightPx;

              return (
                <span
                  key={hour}
                  className="pointer-events-none absolute left-0 right-0 border-t border-zinc-800"
                  style={{ top }}
                />
              );
            })}

            {events.length === 0 ? (
              <p className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 px-2 text-center text-sm text-zinc-600">
                Bu gün için rezervasyon yok.
              </p>
            ) : null}

            {showNowLine ? (
              <div
                className="pointer-events-none absolute left-0 right-0 z-20 flex items-center"
                style={{ top: nowTopPx }}
              >
                <span className="-ml-[3.25rem] rounded-md bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                  {format(now, "HH:mm")}
                </span>
                <span className="h-0.5 flex-1 bg-red-500" />
              </div>
            ) : null}

            {events.map((event) => {
              const { startMin, endMin } = resolveEventWindow(event);
              const topPx =
                ((startMin - timelineStartMin) / timelineSpanMin) *
                timelineHeightPx;
              const heightPx = Math.max(
                44,
                ((endMin - startMin) / timelineSpanMin) * timelineHeightPx,
              );
              const timeLabel = `${event.startTime} – ${event.endTime}`;
              const eventTitle = `${event.categoryTitle} (${event.coupleLabel})`;

              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => onOpenReservation(event.reservationId)}
                  className="absolute left-0 right-0 z-10 overflow-hidden rounded-md border-l-4 px-3 py-2 text-left transition-opacity hover:opacity-95"
                  style={{
                    top: topPx,
                    height: heightPx,
                    borderLeftColor: event.accentColor,
                    backgroundColor: `${event.accentColor}22`,
                  }}
                >
                  <p
                    className="truncate text-sm font-semibold leading-snug"
                    style={{ color: event.accentColor }}
                  >
                    {eventTitle}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-zinc-400">
                    <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span>{timeLabel}</span>
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
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
  onSelectDate,
  onNewReservation,
  onOpenReservation,
  onToday,
}: {
  date: Date;
  events: CalendarReservationEvent[];
  onBack: () => void;
  onSelectDate: (date: Date) => void;
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

      <WeekDayStrip selectedDate={date} onSelectDate={onSelectDate} />

      <DayTimeline
        date={date}
        events={events}
        onOpenReservation={onOpenReservation}
      />

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
              onSelectDate={setSelectedDate}
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
