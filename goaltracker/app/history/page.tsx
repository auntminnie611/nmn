"use client";

import { useEffect, useState, useCallback } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  subMonths,
  addMonths,
  isSameMonth,
  parseISO,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { getCategoryColor, formatSchedule } from "@/lib/utils";
import { calculateStreak } from "@/lib/goal-utils";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Completion = {
  id: string;
  goalId: string;
  date: string;
  goal: {
    id: string;
    title: string;
    category: string;
    color: string;
    scheduleType: string;
    scheduleDays?: string | null;
    scheduleCount?: number | null;
  };
};

type Goal = {
  id: string;
  title: string;
  category: string;
  color: string;
  scheduleType: string;
  scheduleDays?: string | null;
  scheduleCount?: number | null;
  isActive: boolean;
  completions: { goalId: string; date: string }[];
};

export default function HistoryPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const ms = startOfMonth(currentMonth);
    const me = endOfMonth(currentMonth);
    const from = format(ms, "yyyy-MM-dd");
    const to = format(me, "yyyy-MM-dd");

    const [compRes, goalRes] = await Promise.all([
      fetch(`/api/completions?from=${from}&to=${to}`),
      fetch("/api/goals"),
    ]);
    const [comps, gs] = await Promise.all([compRes.json(), goalRes.json()]);
    setCompletions(comps);
    setGoals(gs);
    setLoading(false);
  }, [currentMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  // Build a map: date string -> completions
  const completionsByDate = completions.reduce<Record<string, Completion[]>>((acc, c) => {
    if (!acc[c.date]) acc[c.date] = [];
    acc[c.date].push(c);
    return acc;
  }, {});

  // Calendar grid padding (start on Monday)
  const firstDay = startOfMonth(currentMonth).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const selectedCompletions = selectedDate ? (completionsByDate[selectedDate] ?? []) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">History</h1>
        <p className="text-slate-500 text-sm mt-0.5">Track your past completions</p>
      </div>

      {/* Streaks overview */}
      {goals.filter((g) => g.completions && calculateStreak(g, g.completions) > 0).length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Active streaks</h2>
          <div className="flex flex-wrap gap-2">
            {goals
              .filter((g) => g.completions && calculateStreak(g, g.completions) > 0)
              .sort((a, b) => calculateStreak(b, b.completions) - calculateStreak(a, a.completions))
              .slice(0, 8)
              .map((g) => (
                <div
                  key={g.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium"
                  style={{ borderColor: `${g.color}40`, backgroundColor: `${g.color}15`, color: g.color }}
                >
                  <Flame className="h-3 w-3" />
                  {calculateStreak(g, g.completions)} · {g.title}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        {/* Calendar header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="font-semibold text-slate-100">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <div className="flex gap-2">
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => setCurrentMonth(new Date())}
              className="text-xs px-2 w-auto"
            >
              Today
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Day of week headers */}
        <div className="grid grid-cols-7 border-b border-slate-800">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="text-center text-xs text-slate-600 font-medium py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {/* Offset */}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`offset-${i}`} className="h-16 border-b border-r border-slate-800/50" />
            ))}

            {days.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const dayCompletions = completionsByDate[dateStr] ?? [];
              const isSelected = selectedDate === dateStr;
              const isTodayDate = isToday(day);

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={cn(
                    "relative h-16 border-b border-r border-slate-800/50 p-1.5 text-left transition-colors hover:bg-slate-800/40",
                    isSelected && "bg-slate-800/60",
                    dayCompletions.length > 0 && "hover:bg-slate-800/60"
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-medium leading-none",
                      isTodayDate
                        ? "flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white"
                        : dayCompletions.length > 0
                        ? "text-slate-200"
                        : "text-slate-600"
                    )}
                  >
                    {format(day, "d")}
                  </span>

                  {/* Completion dots */}
                  {dayCompletions.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 mt-1">
                      {dayCompletions.slice(0, 6).map((c, i) => (
                        <span
                          key={i}
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: c.goal.color }}
                        />
                      ))}
                      {dayCompletions.length > 6 && (
                        <span className="text-[9px] text-slate-500">+{dayCompletions.length - 6}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected date detail */}
      {selectedDate && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <h3 className="font-semibold text-slate-200 mb-3">
            {format(parseISO(selectedDate), "EEEE, MMMM d")}
            <span className="text-slate-500 font-normal ml-2 text-sm">
              {selectedCompletions.length} completed
            </span>
          </h3>
          {selectedCompletions.length === 0 ? (
            <p className="text-slate-500 text-sm">Nothing completed on this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedCompletions.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 py-2 border-b border-slate-800 last:border-0"
                >
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: c.goal.color }}
                  />
                  <div>
                    <span className="text-sm text-slate-200">{c.goal.title}</span>
                    <span
                      className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
                      style={{
                        color: c.goal.color,
                        backgroundColor: `${c.goal.color}20`,
                      }}
                    >
                      {c.goal.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
