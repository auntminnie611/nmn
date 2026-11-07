import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function todayString(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function dateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function weekStart(date?: Date): Date {
  return startOfWeek(date ?? new Date(), { weekStartsOn: 1 });
}

export function weekEnd(date?: Date): Date {
  return endOfWeek(date ?? new Date(), { weekStartsOn: 1 });
}

export function monthStart(date?: Date): Date {
  return startOfMonth(date ?? new Date());
}

export function monthEnd(date?: Date): Date {
  return endOfMonth(date ?? new Date());
}

export function daysInCurrentWeek(): string[] {
  const days = eachDayOfInterval({ start: weekStart(), end: weekEnd() });
  return days.map(dateString);
}

export function daysInCurrentMonth(): string[] {
  const days = eachDayOfInterval({ start: monthStart(), end: monthEnd() });
  return days.map(dateString);
}

export const CATEGORY_COLORS: Record<string, string> = {
  Fitness: "#f59e0b",
  Study: "#6366f1",
  Cleaning: "#10b981",
  Reminders: "#ec4899",
  Health: "#ef4444",
  Work: "#3b82f6",
  Personal: "#8b5cf6",
  General: "#64748b",
};

export const CATEGORIES = ["Fitness", "Study", "Cleaning", "Reminders", "Health", "Work", "Personal", "General"];

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DAY_NAMES_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? "#64748b";
}

export function formatSchedule(goal: {
  scheduleType: string;
  scheduleDays?: string | null;
  scheduleCount?: number | null;
  dueDate?: Date | string | null;
}): string {
  switch (goal.scheduleType) {
    case "daily":
      return "Every day";
    case "weekly_days": {
      if (!goal.scheduleDays) return "Weekly";
      const days = goal.scheduleDays.split(",").map((d) => DAY_NAMES[parseInt(d)]);
      return days.join(", ");
    }
    case "times_per_week":
      return `${goal.scheduleCount ?? 1}× per week`;
    case "times_per_month":
      return `${goal.scheduleCount ?? 1}× per month`;
    case "once":
      return goal.dueDate ? `Due ${format(new Date(goal.dueDate), "MMM d")}` : "One-time";
    default:
      return "";
  }
}
