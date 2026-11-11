"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { formatSchedule, getCategoryColor } from "@/lib/utils";
import { isDueToday, isCompletedToday, calculateStreak, getWeekProgress } from "@/lib/goal-utils";
import { CheckCircle2, Circle, Flame, TrendingUp, AlertCircle, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { GoalCard } from "@/components/goal-card";
import { toast } from "sonner";

type Goal = {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  color: string;
  scheduleType: string;
  scheduleDays?: string | null;
  scheduleCount?: number | null;
  dueDate?: Date | string | null;
  isActive: boolean;
  completions: { goalId: string; date: string }[];
};

export default function DigestPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch("/api/goals");
      const data = await res.json();
      setGoals(Array.isArray(data) ? data.filter((g: Goal) => g.isActive) : []);
    } catch {
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const [today] = useState(() => new Date());
  const todayStr = format(today, "yyyy-MM-dd");

  async function handleToggle(goalId: string, completed: boolean) {
    if (completed) {
      await fetch("/api/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId, date: todayStr }),
      });
    } else {
      await fetch("/api/completions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId, date: todayStr }),
      });
    }
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const withoutToday = g.completions.filter((c) => c.date !== todayStr);
        return {
          ...g,
          completions: completed
            ? [...withoutToday, { goalId, date: todayStr }]
            : withoutToday,
        };
      })
    );
  }

  const dueGoals = goals.filter((g) => isDueToday(g, g.completions));
  const completedToday = goals.filter((g) => !isDueToday(g, g.completions) && isCompletedToday(g, g.completions));
  const totalDue = dueGoals.length + completedToday.length;
  const totalDone = completedToday.length;
  const pct = totalDue === 0 ? 100 : Math.round((totalDone / totalDue) * 100);

  // Goals with active streaks
  const streakGoals = goals
    .map((g) => ({ goal: g, streak: calculateStreak(g, g.completions) }))
    .filter(({ streak }) => streak > 0)
    .sort((a, b) => b.streak - a.streak);

  // Goals with weekly/monthly progress
  const progressGoals = goals
    .filter((g) => ["times_per_week", "times_per_month", "weekly_days"].includes(g.scheduleType))
    .map((g) => ({ goal: g, progress: getWeekProgress(g, g.completions) }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
          <Calendar className="h-4 w-4" />
          {format(today, "EEEE, MMMM d, yyyy")}
        </div>
        <h1 className="text-2xl font-bold text-slate-100">Daily Digest</h1>
        <p className="text-slate-400 text-sm mt-1">Your personal goal summary for today</p>
      </div>

      {/* Summary card */}
      <div
        className={cn(
          "rounded-2xl border p-6",
          pct === 100
            ? "border-emerald-700/40 bg-emerald-900/15"
            : "border-slate-800 bg-slate-900/50"
        )}
      >
        <div className="flex items-center gap-6">
          {/* Big ring */}
          <div className="relative shrink-0">
            <BigRing pct={pct} done={totalDone} total={totalDue} />
          </div>

          <div className="flex-1">
            {pct === 100 ? (
              <div>
                <h2 className="text-emerald-400 font-bold text-xl mb-1">🎉 All done!</h2>
                <p className="text-slate-400 text-sm">
                  You've completed all {totalDone} goal{totalDone !== 1 ? "s" : ""} for today. Great work!
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-slate-100 font-bold text-xl mb-1">
                  {dueGoals.length} remaining
                </h2>
                <p className="text-slate-400 text-sm">
                  {totalDone} of {totalDue} completed so far
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Remaining today */}
      {dueGoals.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Still to do
            </h2>
          </div>
          <div className="space-y-2">
            {dueGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                streak={calculateStreak(goal, goal.completions)}
                isCompletedToday={isCompletedToday(goal, goal.completions)}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </section>
      )}

      {/* Completed today */}
      {completedToday.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Completed today
            </h2>
          </div>
          <div className="space-y-2">
            {completedToday.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                streak={calculateStreak(goal, goal.completions)}
                isCompletedToday={true}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </section>
      )}

      {/* Streaks */}
      {streakGoals.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Flame className="h-4 w-4 text-orange-400" />
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Active streaks
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {streakGoals.map(({ goal, streak }) => (
              <div
                key={goal.id}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-3"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: goal.color }}
                  />
                  <span className="text-xs text-slate-400 truncate">{goal.title}</span>
                </div>
                <div className="flex items-center gap-1 text-orange-400">
                  <Flame className="h-4 w-4" />
                  <span className="font-bold text-lg">{streak}</span>
                  <span className="text-xs text-slate-500 ml-1">days</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Weekly/monthly progress */}
      {progressGoals.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Period progress
            </h2>
          </div>
          <div className="space-y-3">
            {progressGoals.map(({ goal, progress }) => {
              const pct = progress.total === 0 ? 0 : Math.min(progress.done / progress.total, 1);
              return (
                <div
                  key={goal.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/50 p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: goal.color }} />
                      <span className="text-sm text-slate-200 font-medium">{goal.title}</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {progress.done}/{progress.total}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct * 100}%`,
                        backgroundColor: goal.color,
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{formatSchedule(goal)}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function BigRing({ pct, done, total }: { pct: number; done: number; total: number }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);

  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={radius} fill="none" stroke="#1e293b" strokeWidth="8" />
      <circle
        cx="55"
        cy="55"
        r={radius}
        fill="none"
        stroke={pct === 100 ? "#10b981" : "#6366f1"}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 55 55)"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text x="55" y="50" textAnchor="middle" fill="#f1f5f9" fontSize="20" fontWeight="700">
        {pct}%
      </text>
      <text x="55" y="68" textAnchor="middle" fill="#64748b" fontSize="11">
        {done}/{total}
      </text>
    </svg>
  );
}
