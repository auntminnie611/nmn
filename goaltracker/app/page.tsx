"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { GoalCard } from "@/components/goal-card";
import { isDueToday, isCompletedToday, calculateStreak } from "@/lib/goal-utils";
import { CheckCircle2, Circle, TrendingUp, Zap, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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

export default function Dashboard() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    const res = await fetch("/api/goals");
    const data = await res.json();
    setGoals(data.filter((g: Goal) => g.isActive));
    setLoading(false);
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
    // Update local state optimistically
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
  const completedGoals = goals.filter((g) => !isDueToday(g, g.completions) && isCompletedToday(g, g.completions));
  const totalDue = dueGoals.length + completedGoals.length;
  const totalDone = completedGoals.length;
  const completionPct = totalDue === 0 ? 100 : Math.round((totalDone / totalDue) * 100);

  // Group by category
  const grouped = dueGoals.reduce<Record<string, Goal[]>>((acc, g) => {
    if (!acc[g.category]) acc[g.category] = [];
    acc[g.category].push(g);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">
            {format(today, "EEEE, MMMM d")}
          </p>
          <h1 className="text-2xl font-bold text-slate-100 mt-0.5">Today</h1>
        </div>
        <Link href="/goals">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Goal
          </Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Due today"
          value={totalDue}
          icon={<Circle className="h-4 w-4 text-slate-400" />}
        />
        <StatCard
          label="Completed"
          value={totalDone}
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          accent="emerald"
        />
        <StatCard
          label="Progress"
          value={`${completionPct}%`}
          icon={<Zap className="h-4 w-4 text-indigo-400" />}
          accent="indigo"
        />
      </div>

      {/* Progress bar */}
      {totalDue > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-300">Daily progress</span>
            <span className="text-sm text-slate-400">
              {totalDone} / {totalDue}
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-500"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Due goals grouped by category */}
      {goals.length === 0 ? (
        <EmptyState />
      ) : dueGoals.length === 0 ? (
        <AllDoneState />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, categoryGoals]) => (
            <div key={category}>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                {category}
              </h2>
              <div className="space-y-2">
                {categoryGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    streak={calculateStreak(goal, goal.completions)}
                    isCompletedToday={isCompletedToday(goal, goal.completions)}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed today */}
      {completedGoals.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">
            Done today
          </h2>
          <div className="space-y-2">
            {completedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                streak={calculateStreak(goal, goal.completions)}
                isCompletedToday={true}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: "emerald" | "indigo";
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-center">
      <div className="flex items-center justify-center mb-1">{icon}</div>
      <div
        className={`text-xl font-bold ${
          accent === "emerald" ? "text-emerald-400" : accent === "indigo" ? "text-indigo-400" : "text-slate-100"
        }`}
      >
        {value}
      </div>
      <div className="text-[10px] text-slate-500 font-medium mt-0.5">{label}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="h-14 w-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
        <TrendingUp className="h-7 w-7 text-slate-500" />
      </div>
      <h3 className="text-slate-300 font-semibold mb-1">No goals yet</h3>
      <p className="text-slate-500 text-sm mb-6">Start tracking your habits and goals</p>
      <Link href="/goals">
        <Button>
          <Plus className="h-4 w-4" />
          Add your first goal
        </Button>
      </Link>
    </div>
  );
}

function AllDoneState() {
  return (
    <div className="text-center py-12 rounded-xl border border-emerald-800/30 bg-emerald-900/10">
      <div className="text-4xl mb-3">🎉</div>
      <h3 className="text-emerald-400 font-semibold text-lg mb-1">All done for today!</h3>
      <p className="text-slate-400 text-sm">Great work — come back tomorrow.</p>
    </div>
  );
}
