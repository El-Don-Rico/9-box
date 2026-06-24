"use client";

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/toggle";
import { TaskSourceBadge, TaskVisibilityBadge } from "@/components/tasks/task-meta";
import type { TaskData, TaskCommentData, TaskStatus } from "@/types";

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const STATUS_ORDER: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

const FIELD =
  "w-full rounded-lg border border-line-2 bg-paper-2 px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:border-magenta focus:ring-2 focus:ring-magenta/20 focus:outline-none";

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
    <div className="mt-3 border-t border-line pt-3 space-y-2">
      {loading ? (
        <p className="text-xs muted-2">Loading comments…</p>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="text-sm">
            <span className="font-medium text-ink">{c.author?.name ?? "Someone"}</span>{" "}
            <span className="mono tnum text-xs muted-2">
              {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
            <p className="muted">{c.body}</p>
          </div>
        ))
      )}
      <div className="flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") add(); }}
          placeholder="Add a comment or update…"
          className={`flex-1 ${FIELD} py-1.5`}
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
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="card-title">{title}</h2>
          {tasks.length > 0 && (
            <Badge variant="slate"><span className="mono tnum">{tasks.length}</span></Badge>
          )}
        </div>
        {canManage && !showForm && (
          <Button size="sm" variant="secondary" onClick={() => setShowForm(true)}>Add Task</Button>
        )}
      </div>

      {showForm && (
        <div className="rounded-lg border border-line p-4 mb-4 space-y-3">
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Task"
            className={FIELD}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={form.assigneeId}
              onChange={(e) => setForm((f) => ({ ...f, assigneeId: e.target.value }))}
              className={FIELD}
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
              className={`mono tnum ${FIELD}`}
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
        <p className="text-sm muted-2 text-center py-2">{emptyText}</p>
      ) : (
        <Card className="p-0 overflow-hidden">
          {tasks.map((task, i) => (
            <div key={task.id} className={`p-4 ${i > 0 ? "border-t border-line" : ""}`}>
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={task.status === "DONE"}
                  onChange={(v) => updateStatus(task.id, v ? "DONE" : "TODO")}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium text-ink ${task.status === "DONE" ? "line-through opacity-60" : ""}`}>
                    {task.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="text-xs muted">{task.assignee?.name ?? "Unassigned"}</span>
                    {task.dueDate && (
                      <span className="mono tnum text-xs muted-2">
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
                  className="rounded-lg border border-line-2 bg-paper px-2 py-1 text-xs text-ink focus:border-magenta focus:outline-none"
                >
                  {STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setExpanded(expanded === task.id ? null : task.id)}
                className="inline-flex items-center gap-1 text-xs muted hover:text-ink mt-2 ml-8"
              >
                {expanded === task.id ? "Hide updates" : "Comments & updates"}
                <ChevronRight size={14} strokeWidth={1.6} className={expanded === task.id ? "rotate-90 transition-transform" : "transition-transform"} />
              </button>
              {expanded === task.id && <div className="ml-8"><TaskComments taskId={task.id} /></div>}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
