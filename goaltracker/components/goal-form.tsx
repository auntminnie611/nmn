"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, DAY_NAMES, getCategoryColor } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ec4899",
  "#ef4444", "#3b82f6", "#8b5cf6", "#f97316",
  "#14b8a6", "#84cc16",
];

type GoalFormData = {
  id?: string;
  title: string;
  description: string;
  category: string;
  color: string;
  scheduleType: string;
  scheduleDays: string[];
  scheduleCount: string;
  dueDate: string;
};

interface GoalFormProps {
  initial?: Partial<GoalFormData> & { id?: string };
  onSuccess: () => void;
  onCancel?: () => void;
}

export function GoalForm({ initial, onSuccess, onCancel }: GoalFormProps) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState<GoalFormData>({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    category: initial?.category ?? "General",
    color: initial?.color ?? "#6366f1",
    scheduleType: initial?.scheduleType ?? "daily",
    scheduleDays: initial?.scheduleDays ?? [],
    scheduleCount: initial?.scheduleCount ?? "1",
    dueDate: initial?.dueDate ?? "",
  });
  const [loading, setLoading] = useState(false);

  function set(field: keyof GoalFormData, value: string | string[]) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleDay(dayNum: string) {
    const days = form.scheduleDays.includes(dayNum)
      ? form.scheduleDays.filter((d) => d !== dayNum)
      : [...form.scheduleDays, dayNum];
    set("scheduleDays", days);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category,
        color: form.color,
        scheduleType: form.scheduleType,
        scheduleDays: form.scheduleType === "weekly_days" ? form.scheduleDays.join(",") : null,
        scheduleCount: ["times_per_week", "times_per_month"].includes(form.scheduleType)
          ? parseInt(form.scheduleCount) || 1
          : null,
        dueDate: form.scheduleType === "once" ? form.dueDate || null : null,
      };

      if (isEdit) {
        await fetch(`/api/goals/${initial!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, isActive: true }),
        });
        toast.success("Goal updated");
      } else {
        await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        toast.success("Goal created!");
      }
      onSuccess();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title">Goal title *</Label>
        <Input
          id="title"
          placeholder="e.g. Lift lower body"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          autoFocus
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="desc">Description (optional)</Label>
        <Textarea
          id="desc"
          placeholder="Any details..."
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
        />
      </div>

      {/* Category + Color */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => set("category", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Color</Label>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set("color", c)}
                className={cn(
                  "h-6 w-6 rounded-full border-2 transition-all",
                  form.color === c ? "border-white scale-110" : "border-transparent hover:scale-105"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Schedule type */}
      <div className="space-y-1.5">
        <Label>Schedule</Label>
        <Select value={form.scheduleType} onValueChange={(v) => set("scheduleType", v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Every day</SelectItem>
            <SelectItem value="weekly_days">Specific days of week</SelectItem>
            <SelectItem value="times_per_week">N times per week</SelectItem>
            <SelectItem value="times_per_month">N times per month</SelectItem>
            <SelectItem value="once">One-time reminder</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Specific days */}
      {form.scheduleType === "weekly_days" && (
        <div className="space-y-1.5">
          <Label>Days of week</Label>
          <div className="flex gap-2 flex-wrap">
            {DAY_NAMES.map((name, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(String(i))}
                className={cn(
                  "h-9 w-9 rounded-lg text-xs font-semibold border transition-all",
                  form.scheduleDays.includes(String(i))
                    ? "border-indigo-500 bg-indigo-600/30 text-indigo-300"
                    : "border-slate-700 text-slate-400 hover:border-slate-500"
                )}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Count */}
      {["times_per_week", "times_per_month"].includes(form.scheduleType) && (
        <div className="space-y-1.5">
          <Label>
            Times per {form.scheduleType === "times_per_week" ? "week" : "month"}
          </Label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => set("scheduleCount", String(Math.max(1, parseInt(form.scheduleCount) - 1)))}
              className="h-9 w-9 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-lg font-bold flex items-center justify-center"
            >
              −
            </button>
            <Input
              type="number"
              min="1"
              max="31"
              value={form.scheduleCount}
              onChange={(e) => set("scheduleCount", e.target.value)}
              className="w-20 text-center"
            />
            <button
              type="button"
              onClick={() => set("scheduleCount", String(Math.min(31, parseInt(form.scheduleCount) + 1)))}
              className="h-9 w-9 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-lg font-bold flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Due date for one-time */}
      {form.scheduleType === "once" && (
        <div className="space-y-1.5">
          <Label htmlFor="dueDate">Due date</Label>
          <Input
            id="dueDate"
            type="date"
            value={form.dueDate}
            onChange={(e) => set("dueDate", e.target.value)}
            className="[color-scheme:dark]"
          />
        </div>
      )}

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Saving..." : isEdit ? "Save changes" : "Create goal"}
        </Button>
      </div>
    </form>
  );
}
