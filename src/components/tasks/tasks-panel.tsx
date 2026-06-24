"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TaskSourceBadge, TaskVisibilityBadge } from "@/components/tasks/task-meta";
import type { TaskData, TaskCommentData, TaskStatus } from "@/types";

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const STATUS_ORDER: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

function statusColor(status: TaskStatus): string {
  switch (status) {
    case "DONE":
      return "bg-green-100 text-green-800 border-green-300";
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-800 border-amber-300";
    default:
      return "bg-gray-100 text-gray-600 border-gray-300";
  }
}

interface AssigneeOption {
  id: string;
  name: string;
}

interface TasksPanelProps {
  employeeId: string;
  canManage?: boolean;
  assigneeOptions?: AssigneeOption[];
  title?: string;
  emptyText?: string;
}

function TaskComments({ taskId }: { taskId: string }) {
  const [comments, setComments] = useState<TaskCommentData[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/tasks/${taskId}/comments`)
      .then((r) => (r.ok ? r.json() : []))
      .then((c) => {
        setComments(Array.isArray(c) ? c : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [taskId]);

  async function add() {
    if (!body.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.ok) {
        const created = await res.json();
        setComments((prev) => [...prev, created]);
        setBody("");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
      {loading ? (
        <p className="text-xs text-gray-400">Loading comments…</p>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="text-sm">
            <span className="font-medium text-visory-navy">{c.author?.name ?? "Someone"}</span>{" "}
            <span className="text-xs text-gray-400">
              {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
            <p className="text-gray-600">{c.body}</p>
          </div>
        ))
      )}
      <div className="flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") add(); }}
          placeholder="Add a comment or update…"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-visory"
        />
        <Button size="sm" variant="secondary" onClick={add} disabled={saving || !body.trim()}>Post</Button>
      </div>
    </div>
  );
}

export function TasksPanel({
  employeeId,
  canManage = false,
  assigneeOptions = [],
  title = "Tasks",
  emptyText = "No tasks yet.",
}: TasksPanelProps) {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", assigneeId: "", dueDate: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/tasks?employeeId=${employeeId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((t) => {
        setTasks(Array.isArray(t) ? t : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [employeeId]);

  async function updateStatus(taskId: string, status: TaskStatus) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, status }),
    });
  }

  async function addTask() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          title: form.title.trim(),
          assigneeId: form.assigneeId || null,
          dueDate: form.dueDate || null,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setTasks((prev) => [created, ...prev]);
        setForm({ title: "", assigneeId: "", dueDate: "" });
        setShowForm(false);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          {tasks.length > 0 && (
            <Badge className="bg-gray-200 text-gray-600 border-gray-300 text-xs">{tasks.length}</Badge>
          )}
        </div>
        {canManage && !showForm && (
          <Button size="sm" variant="secondary" onClick={() => setShowForm(true)}>Add Task</Button>
        )}
      </div>

      {showForm && (
        <div className="rounded-lg border border-gray-200 p-4 mb-4 space-y-3">
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Task"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-visory"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={form.assigneeId}
              onChange={(e) => setForm((f) => ({ ...f, assigneeId: e.target.value }))}
              className="rounded-lg border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-visory"
            >
              <option value="">Unassigned</option>
              {assigneeOptions.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              className="rounded-lg border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-visory"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={addTask} disabled={saving || !form.title.trim()}>
              {saving ? "Saving…" : "Save Task"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {tasks.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-2">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="rounded-lg border border-gray-200 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className={`text-sm font-medium text-visory-navy ${task.status === "DONE" ? "line-through opacity-60" : ""}`}>
                    {task.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{task.assignee?.name ?? "Unassigned"}</span>
                    {task.dueDate && (
                      <span className="text-xs text-gray-400">
                        Due {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    )}
                    <TaskSourceBadge task={task} canSeeMeeting={canManage} />
                    <TaskVisibilityBadge task={task} />
                  </div>
                </div>
                <select
                  value={task.status}
                  onChange={(e) => updateStatus(task.id, e.target.value as TaskStatus)}
                  className={`rounded-lg border px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-visory ${statusColor(task.status)}`}
                >
                  {STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setExpanded(expanded === task.id ? null : task.id)}
                className="text-xs text-visory hover:text-visory-dark font-medium mt-2"
              >
                {expanded === task.id ? "Hide updates" : "Comments & updates"}
              </button>
              {expanded === task.id && <TaskComments taskId={task.id} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
