import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  eachMonthOfInterval,
  subWeeks,
  subMonths,
  isWithinInterval,
  getDay,
} from "date-fns";

type Goal = {
  id: string;
  scheduleType: string;
  scheduleDays?: string | null;
  scheduleCount?: number | null;
  dueDate?: Date | string | null;
  isActive: boolean;
};

type Completion = {
  goalId: string;
  date: string;
};

function dateString(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function weekStartDate(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

function weekEndDate(date: Date): Date {
  return endOfWeek(date, { weekStartsOn: 1 });
}

export function isDueToday(goal: Goal, completions: Completion[]): boolean {
  if (!goal.isActive) return false;
  const today = new Date();
  const todayStr = dateString(today);
  const todayDayNum = getDay(today);

  const completedToday = completions.some((c) => c.goalId === goal.id && c.date === todayStr);

  switch (goal.scheduleType) {
    case "daily":
      return !completedToday;

    case "weekly_days": {
      if (!goal.scheduleDays) return false;
      const days = goal.scheduleDays.split(",").map(Number);
      return days.includes(todayDayNum) && !completedToday;
    }

    case "times_per_week": {
      const count = goal.scheduleCount ?? 1;
      const ws = weekStartDate(today);
      const we = weekEndDate(today);
      const weekCompletions = completions.filter((c) => {
        if (c.goalId !== goal.id) return false;
        const d = parseISO(c.date);
        return isWithinInterval(d, { start: ws, end: we });
      });
      return weekCompletions.length < count;
    }

    case "times_per_month": {
      const count = goal.scheduleCount ?? 1;
      const ms = startOfMonth(today);
      const me = endOfMonth(today);
      const monthCompletions = completions.filter((c) => {
        if (c.goalId !== goal.id) return false;
        const d = parseISO(c.date);
        return isWithinInterval(d, { start: ms, end: me });
      });
      return monthCompletions.length < count;
    }

    case "once": {
      if (!goal.dueDate) return false;
      const due = new Date(goal.dueDate);
      return due <= today && !completedToday;
    }

    default:
      return false;
  }
}

export function isCompletedToday(goal: Goal, completions: Completion[]): boolean {
  const todayStr = dateString(new Date());
  if (goal.scheduleType === "times_per_week") {
    const today = new Date();
    const ws = weekStartDate(today);
    const we = weekEndDate(today);
    const weekCompletions = completions.filter((c) => {
      if (c.goalId !== goal.id) return false;
      const d = parseISO(c.date);
      return isWithinInterval(d, { start: ws, end: we });
    });
    return weekCompletions.length >= (goal.scheduleCount ?? 1);
  }
  if (goal.scheduleType === "times_per_month") {
    const today = new Date();
    const ms = startOfMonth(today);
    const me = endOfMonth(today);
    const monthCompletions = completions.filter((c) => {
      if (c.goalId !== goal.id) return false;
      const d = parseISO(c.date);
      return isWithinInterval(d, { start: ms, end: me });
    });
    return monthCompletions.length >= (goal.scheduleCount ?? 1);
  }
  return completions.some((c) => c.goalId === goal.id && c.date === todayStr);
}

export function getWeekProgress(goal: Goal, completions: Completion[]): { done: number; total: number } {
  const today = new Date();
  const ws = weekStartDate(today);
  const we = weekEndDate(today);

  if (goal.scheduleType === "times_per_week") {
    const done = completions.filter((c) => {
      if (c.goalId !== goal.id) return false;
      const d = parseISO(c.date);
      return isWithinInterval(d, { start: ws, end: we });
    }).length;
    return { done, total: goal.scheduleCount ?? 1 };
  }

  if (goal.scheduleType === "times_per_month") {
    const ms = startOfMonth(today);
    const me = endOfMonth(today);
    const done = completions.filter((c) => {
      if (c.goalId !== goal.id) return false;
      const d = parseISO(c.date);
      return isWithinInterval(d, { start: ms, end: me });
    }).length;
    return { done, total: goal.scheduleCount ?? 1 };
  }

  if (goal.scheduleType === "weekly_days") {
    const days = goal.scheduleDays ? goal.scheduleDays.split(",").map(Number) : [];
    const total = days.length;
    const done = completions.filter((c) => {
      if (c.goalId !== goal.id) return false;
      const d = parseISO(c.date);
      return isWithinInterval(d, { start: ws, end: we });
    }).length;
    return { done: Math.min(done, total), total };
  }

  if (goal.scheduleType === "daily") {
    const todayDayNum = today.getDay();
    const daysSoFar = todayDayNum === 0 ? 7 : todayDayNum;
    const done = completions.filter((c) => {
      if (c.goalId !== goal.id) return false;
      const d = parseISO(c.date);
      return isWithinInterval(d, { start: ws, end: we });
    }).length;
    return { done, total: 7 };
  }

  return { done: 0, total: 1 };
}

export function calculateStreak(goal: Goal, completions: Completion[]): number {
  const goalCompletions = completions
    .filter((c) => c.goalId === goal.id)
    .map((c) => c.date)
    .sort();

  if (goalCompletions.length === 0) return 0;

  const today = new Date();

  if (goal.scheduleType === "daily" || goal.scheduleType === "weekly_days") {
    // Count consecutive days / weeks back from today
    let streak = 0;
    let checkDate = new Date(today);

    while (true) {
      const checkStr = dateString(checkDate);
      const hasCompletion = goalCompletions.includes(checkStr);

      if (goal.scheduleType === "daily") {
        if (!hasCompletion) break;
        streak++;
        checkDate = new Date(checkDate);
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // weekly_days
        const days = goal.scheduleDays ? goal.scheduleDays.split(",").map(Number) : [];
        const dayNum = getDay(checkDate);
        if (days.includes(dayNum)) {
          if (!hasCompletion) break;
          streak++;
        }
        checkDate.setDate(checkDate.getDate() - 1);
        if (streak > 365) break;
      }
    }
    return streak;
  }

  if (goal.scheduleType === "times_per_week") {
    const count = goal.scheduleCount ?? 1;
    let streak = 0;
    let weekDate = new Date(today);

    for (let i = 0; i < 52; i++) {
      const ws = weekStartDate(weekDate);
      const we = weekEndDate(weekDate);
      const weekCount = goalCompletions.filter((dateStr) => {
        const d = parseISO(dateStr);
        return isWithinInterval(d, { start: ws, end: we });
      }).length;

      if (weekCount >= count) {
        streak++;
        weekDate = new Date(ws);
        weekDate.setDate(weekDate.getDate() - 1);
      } else {
        // Allow current week to be in-progress
        if (i === 0) {
          weekDate = new Date(ws);
          weekDate.setDate(weekDate.getDate() - 1);
          continue;
        }
        break;
      }
    }
    return streak;
  }

  if (goal.scheduleType === "times_per_month") {
    const count = goal.scheduleCount ?? 1;
    let streak = 0;
    let monthDate = new Date(today);

    for (let i = 0; i < 24; i++) {
      const ms = startOfMonth(monthDate);
      const me = endOfMonth(monthDate);
      const monthCount = goalCompletions.filter((dateStr) => {
        const d = parseISO(dateStr);
        return isWithinInterval(d, { start: ms, end: me });
      }).length;

      if (monthCount >= count) {
        streak++;
        monthDate = new Date(ms);
        monthDate.setDate(monthDate.getDate() - 1);
      } else {
        if (i === 0) {
          monthDate = new Date(ms);
          monthDate.setDate(monthDate.getDate() - 1);
          continue;
        }
        break;
      }
    }
    return streak;
  }

  return 0;
}
