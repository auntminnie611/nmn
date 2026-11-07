"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { GoalForm } from "@/components/goal-form";
import { formatSchedule, getCategoryColor } from "@/lib/utils";
import { calculateStreak } from "@/lib/goal-utils";
import { Plus, Pencil, Trash2, Flame, ChevronDown, ChevronUp, Archive } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const fetchGoals = useCallback(async () => {
    const res = await fetch("/api/goals");
    setGoals(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  async function deleteGoal(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    setGoals((g) => g.filter((x) => x.id !== id));
    toast.success("Goal deleted");
  }

  async function archiveGoal(goal: Goal) {
    await fetch(`/api/goals/${goal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...goal, isActive: !goal.isActive }),
    });
    setGoals((prev) => prev.map((g) => g.id === goal.id ? { ...g, isActive: !g.isActive } : g));
    toast.success(goal.isActive ? "Goal archived" : "Goal restored");
  }

  const activeGoals = goals.filter((g) => g.isActive);
  const archivedGoals = goals.filter((g) => !g.isActive);

  // Group by category
  const grouped = activeGoals.reduce<Record<string, Goal[]>>((acc, g) => {
    if (!acc[g.category]) acc[g.category] = [];
    acc[g.category].push(g);
    return acc;
  }, {});

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Goals</h1>
          <p className="text-slate-500 text-sm mt-0.5">{activeGoals.length} active goal{activeGoals.length !== 1 ? "s" : ""}</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              New goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add new goal</DialogTitle>
            </DialogHeader>
            <GoalForm
              onSuccess={() => {
                setAddOpen(false);
                fetchGoals();
              }}
              onCancel={() => setAddOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Goals grouped by category */}
      {activeGoals.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-slate-800">
          <p className="text-slate-400 mb-4">No goals yet. Add one to get started!</p>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add goal
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, categoryGoals]) => (
            <div key={category}>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: getCategoryColor(category) }}
                />
                {category}
              </h2>
              <div className="space-y-2">
                {categoryGoals.map((goal) => (
                  <GoalRow
                    key={goal.id}
                    goal={goal}
                    onEdit={() => setEditGoal(goal)}
                    onDelete={() => deleteGoal(goal.id, goal.title)}
                    onArchive={() => archiveGoal(goal)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Archived section */}
      {archivedGoals.length > 0 && (
        <div>
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors mb-3"
          >
            {showArchived ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Archived ({archivedGoals.length})
          </button>
          {showArchived && (
            <div className="space-y-2 opacity-60">
              {archivedGoals.map((goal) => (
                <GoalRow
                  key={goal.id}
                  goal={goal}
                  onEdit={() => setEditGoal(goal)}
                  onDelete={() => deleteGoal(goal.id, goal.title)}
                  onArchive={() => archiveGoal(goal)}
                  archived
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editGoal} onOpenChange={(open) => !open && setEditGoal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit goal</DialogTitle>
          </DialogHeader>
          {editGoal && (
            <GoalForm
              initial={{
                id: editGoal.id,
                title: editGoal.title,
                description: editGoal.description ?? "",
                category: editGoal.category,
                color: editGoal.color,
                scheduleType: editGoal.scheduleType,
                scheduleDays: editGoal.scheduleDays ? editGoal.scheduleDays.split(",") : [],
                scheduleCount: String(editGoal.scheduleCount ?? 1),
                dueDate: editGoal.dueDate
                  ? new Date(editGoal.dueDate).toISOString().split("T")[0]
                  : "",
              }}
              onSuccess={() => {
                setEditGoal(null);
                fetchGoals();
              }}
              onCancel={() => setEditGoal(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GoalRow({
  goal,
  onEdit,
  onDelete,
  onArchive,
  archived = false,
}: {
  goal: Goal;
  onEdit: () => void;
  onDelete: () => void;
  onArchive: () => void;
  archived?: boolean;
}) {
  const color = goal.color;
  const streak = calculateStreak(goal, goal.completions);
  const totalCompletions = goal.completions.length;

  return (
    <div className="group flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 hover:border-slate-700 transition-all">
      {/* Color dot */}
      <div
        className="h-3 w-3 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-slate-200 truncate">{goal.title}</span>
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="text-xs text-slate-500">{formatSchedule(goal)}</span>
          {streak > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-orange-400">
              <Flame className="h-3 w-3" /> {streak} streak
            </span>
          )}
          <span className="text-xs text-slate-600">{totalCompletions} total</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="icon-sm" variant="ghost" onClick={onEdit} title="Edit">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon-sm" variant="ghost" onClick={onArchive} title={archived ? "Restore" : "Archive"}>
          <Archive className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon-sm" variant="ghost" onClick={onDelete} title="Delete" className="text-red-400 hover:text-red-300">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
