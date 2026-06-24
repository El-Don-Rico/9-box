"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isManager as checkIsManager } from "@/lib/permissions";
import type { TaskData } from "@/types";

type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETE";

const COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: "TODO", label: "To Do" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "COMPLETE", label: "Complete" },
];

const CATEGORY_SUGGESTIONS = ["1:1 Action", "PIP", "Development", "Performance", "General"];

interface RosterMember {
  id: string;
  name: string;
}

export default function TasksPage() {
  const { data: session } = useSession();
  const isManager = session?.user?.role
    ? checkIsManager(session.user.role as never)
    : false;

  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [roster, setRoster] = useState<RosterMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [newDue, setNewDue] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [saving, setSaving] = useState(false);

  const loadTasks = useCallback(() => {
    const params = new URLSearchParams();
    if (filterEmployee) params.set("employeeId", filterEmployee);
    if (filterCategory) params.set("category", filterCategory);
    return fetch(`/api/tasks?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTasks(data);
      });
  }, [filterEmployee, filterCategory]);

  useEffect(() => {
    if (isManager) {
      fetch("/api/team")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setRoster(data.map((m) => ({ id: m.id, name: m.name })));
        })
        .catch(() => {});
    }
  }, [isManager]);

  useEffect(() => {
    loadTasks().finally(() => setLoading(false));
  }, [loadTasks]);

  const categories = useMemo(() => {
    const set = new Set<string>(CATEGORY_SUGGESTIONS);
    tasks.forEach((t) => t.category && set.add(t.category));
    return [...set].sort();
  }, [tasks]);

  async function updateStatus(taskId: string, status: TaskStatus) {
    const res = await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    }
  }

  async function deleteTask(taskId: string) {
    const res = await fetch(`/api/tasks?taskId=${taskId}`, { method: "DELETE" });
    if (res.ok) setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  async function createTask() {
    if (!newTitle.trim() || !newAssignee) return;
    setSaving(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          assigneeId: newAssignee,
          dueDate: newDue || null,
          category: newCategory.trim() || null,
        }),
      });
      if (res.ok) {
        setNewTitle("");
        setNewAssignee("");
        setNewDue("");
        setNewCategory("");
        setShowForm(false);
        loadTasks();
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  const grouped: Record<TaskStatus, TaskData[]> = { TODO: [], IN_PROGRESS: [], COMPLETE: [] };
  for (const t of tasks) grouped[t.status].push(t);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-visory-navy">Tasks</h1>
          <p className="text-sm text-gray-600 mt-1">Actions and follow-ups</p>
        </div>
        {isManager && (
          <Button size="sm" onClick={() => setShowForm((s) => !s)}>
            {showForm ? "Cancel" : "New Task"}
          </Button>
        )}
      </div>

      {/* Filters (managers) */}
      {isManager && (
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterEmployee}
            onChange={(e) => setFilterEmployee(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:ring-visory"
          >
            <option value="">All employees</option>
            {roster.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:ring-visory"
          >
            <option value="">All types</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {(filterEmployee || filterCategory) && (
            <Button size="sm" variant="ghost" onClick={() => { setFilterEmployee(""); setFilterCategory(""); }}>
              Clear
            </Button>
          )}
        </div>
      )}

      {/* New task form */}
      {showForm && isManager && (
        <Card>
          <CardContent className="py-4 space-y-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task title"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-visory"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-visory"
              >
                <option value="">Assign to…</option>
                {roster.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <input
                type="date"
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-visory"
              />
              <input
                type="text"
                list="task-categories"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Type (e.g. 1:1 Action)"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-visory"
              />
              <datalist id="task-categories">
                {CATEGORY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <Button size="sm" onClick={createTask} disabled={saving || !newTitle.trim() || !newAssignee}>
              {saving ? "Saving..." : "Create Task"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const items = grouped[col.key];
          return (
            <div key={col.key}>
              <div className="flex items-center justify-between mb-2 px-1">
                <p className="text-sm font-semibold text-visory-navy">{col.label}</p>
                <Badge className="bg-gray-100 text-gray-600 border-gray-300 text-[11px]">{items.length}</Badge>
              </div>
              <div className="space-y-2 rounded-lg bg-gray-50 p-2 min-h-[100px]">
                {items.map((t) => {
                  const overdue = t.dueDate && t.status !== "COMPLETE" && new Date(t.dueDate) < new Date();
                  return (
                    <div key={t.id} className="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
                      <p className="text-sm font-medium text-visory-navy">{t.title}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="text-[11px] text-gray-500">{t.assignee.name}</span>
                        {t.category && (
                          <Badge className="bg-visory-light text-visory-dark border-visory/30 text-[10px]">{t.category}</Badge>
                        )}
                        {t.dueDate && (
                          <span className={`text-[11px] ${overdue ? "text-red-600 font-medium" : "text-gray-400"}`}>
                            Due {new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {col.key !== "TODO" && (
                          <Button size="sm" variant="ghost" className="text-[11px] px-2 py-1"
                            onClick={() => updateStatus(t.id, col.key === "COMPLETE" ? "IN_PROGRESS" : "TODO")}>
                            ← Back
                          </Button>
                        )}
                        {col.key !== "COMPLETE" && (
                          <Button size="sm" className="text-[11px] px-2 py-1"
                            onClick={() => updateStatus(t.id, col.key === "TODO" ? "IN_PROGRESS" : "COMPLETE")}>
                            {col.key === "TODO" ? "Start →" : "Complete ✓"}
                          </Button>
                        )}
                        {isManager && (
                          <Button size="sm" variant="ghost" className="text-[11px] px-2 py-1 text-red-600"
                            onClick={() => deleteTask(t.id)}>
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && (
                  <p className="text-[11px] text-gray-400 text-center py-4">No tasks</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
