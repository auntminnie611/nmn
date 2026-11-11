"use client";

import { useState } from "react";
import { Check, Flame, TrendingUp } from "lucide-react";
import { cn, getCategoryColor, formatSchedule } from "@/lib/utils";
import { getWeekProgress } from "@/lib/goal-utils";
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

interface GoalCardProps {
  goal: Goal;
  streak: number;
  isCompletedToday: boolean;
  onToggle: (goalId: string, completed: boolean) => Promise<void>;
}

function ProgressRing({ done, total, color }: { done: number; total: number; color: string }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const pct = total === 0 ? 0 : Math.min(done / total, 1);
  const offset = circumference * (1 - pct);

  return (
    <svg width="52" height="52" viewBox="0 0 52 52" className="shrink-0">
      <circle cx="26" cy="26" r={radius} fill="none" stroke="#1e293b" strokeWidth="4" />
      <circle
        cx="26"
        cy="26"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 26 26)"
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
      <text x="26" y="30" textAnchor="middle" fill="#f1f5f9" fontSize="11" fontWeight="600">
        {done}/{total}
      </text>
    </svg>
  );
}

export function GoalCard({ goal, streak, isCompletedToday: initialDone, onToggle }: GoalCardProps) {
  const [loading, setLoading] = useState(false);
  const [localDone, setLocalDone] = useState(initialDone);
  const color = goal.color || getCategoryColor(goal.category);
  const progress = getWeekProgress(goal, goal.completions);
  const showRing = ["times_per_week", "times_per_month", "weekly_days"].includes(goal.scheduleType);

  async function handleToggle() {
    if (loading) return;
    setLoading(true);
    const nextDone = !localDone;
    setLocalDone(nextDone);
    try {
      await onToggle(goal.id, nextDone);
      toast(nextDone ? "✓ Marked complete!" : "Unmarked", { duration: 1500 });
    } catch {
      setLocalDone(!nextDone);
      toast.error("Failed to update");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={cn(
        "group relative rounded-xl border transition-all duration-200 overflow-hidden",
        localDone
          ? "border-slate-700/50 bg-slate-900/30"
          : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/80"
      )}
    >
      {/* Left accent */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ backgroundColor: color, opacity: localDone ? 0.4 : 1 }}
      />

      <div className="flex items-center gap-4 px-4 py-4 pl-5">
        {/* Check button */}
        <button
          onClick={handleToggle}
          disabled={loading}
          aria-label={localDone ? "Unmark complete" : "Mark complete"}
          className={cn(
            "shrink-0 h-9 w-9 rounded-full border-2 flex items-center justify-center transition-all duration-200",
            localDone
              ? "border-transparent text-white"
              : "border-slate-600 text-transparent hover:border-slate-400"
          )}
          style={localDone ? { backgroundColor: color } : {}}
        >
          <Check className={cn("h-4 w-4 transition-all", localDone ? "opacity-100 scale-100" : "opacity-0 scale-50")} />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "font-medium text-sm transition-all",
                localDone ? "text-slate-500 line-through" : "text-slate-100"
              )}
            >
              {goal.title}
            </span>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border"
              style={{
                color,
                borderColor: `${color}40`,
                backgroundColor: `${color}15`,
              }}
            >
              {goal.category}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-slate-500">{formatSchedule(goal)}</span>
            {streak > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-orange-400">
                <Flame className="h-3 w-3" />
                {streak}
              </span>
            )}
          </div>
          {goal.description && (
            <p className="text-xs text-slate-500 mt-1 truncate">{goal.description}</p>
          )}
        </div>

        {/* Progress ring for multi-completion goals */}
        {showRing && (
          <ProgressRing done={progress.done} total={progress.total} color={color} />
        )}
      </div>
    </div>
  );
}
