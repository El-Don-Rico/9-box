"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskSourceBadge, TaskVisibilityBadge } from "@/components/tasks/task-meta";
import type { TaskData, TaskStatus, TaskCommentData } from "@/types";

const MANAGER_ROLES = ["MANAGER", "AREA_LEAD", "LEADERSHIP", "ADMIN"];

const STATUS_LABELS: Record<TaskStatus, string> = { TODO: "To Do", IN_PROGRESS: "In Progress", DONE: "Done" };
const STATUS_ORDER: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

function statusColor(status: TaskStatus): string {
  switch (status) {
    case "DONE": return "bg-green-100 text-green-800 border-green-300";
    case "IN_PROGRESS": return "bg-amber-100 text-amber-800 border-amber-300";
    default: return "bg-gray-100 text-gray-600 border-gray-300";
  }
}

interface Report { id: string; name: string }

function TaskComments({ taskId }: { taskId: string }) {
  const [comments, setComments] = useState<TaskCommentData[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tasks/${taskId}/comments`)
      .then((r) => (r.ok ? r.json() : []))
      .then((c) => { setComments(Array.isArray(c) ? c : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [taskId]);

  async function add() {
    if (!body.trim()) return;
    const res = await fetch(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (res.ok) { const c = await res.json(); setComments((p) => [...p, c]); setBody(""); }
  }

  return (
    <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
      {loading ? (
        <p className="text-xs text-gray-400">Loading…</p>
      ) : comments.map((c) => (
        <div key={c.id} className="text-sm">
          <span className="font-medium text-visory-navy">{c.author?.name ?? "Someone"}</span>{" "}
          <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          <p className="text-gray-600">{c.body}</p>
        </div>
      ))}
      <div className="flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") add(); }}
          placeholder="Add a comment or update…"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-visory"
        />
        <Button size="sm" variant="secondary" onClick={add} disabled={!body.trim()}>Post</Button>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const manager = role ? MANAGER_ROLES.includes(role) : false;

  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ employeeId: "", title: "", assigneeId: "", dueDate: "", visibility: "SHARED", isPip: false });
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterType, setFilterType] = useState("");

  useEffect(() => {
    if (!role) return;
    const url = manager ? "/api/tasks?scope=managed" : "/api/tasks?scope=mine";
    fetch(url).then((r) => (r.ok ? r.json() : [])).then((t) => {
      setTasks(Array.isArray(t) ? t : []);
      setLoading(false);
    }).catch(() => setLoading(false));
    if (manager) {
      fetch("/api/team").then((r) => (r.ok ? r.json() : [])).then((t) => {
        if (Array.isArray(t)) setReports(t.map((m: { id: string; name: string }) => ({ id: m.id, name: m.name })));
      });
    }
  }, [role, manager]);

  const assigneeOptions = useMemo(() => {
    const opts: Report[] = [];
    if (form.employeeId) {
      const r = reports.find((x) => x.id === form.employeeId);
      if (r) opts.push(r);
    }
    if (session?.user?.id && session.user.name) opts.push({ id: session.user.id, name: session.user.name });
    return opts.filter((o, i, a) => a.findIndex((x) => x.id === o.id) === i);
  }, [form.employeeId, reports, session?.user?.id, session?.user?.name]);

  // "Type" filter mirrors the source label (Manual / Meeting action / Performance plan).
  function typeOf(t: TaskData): string {
    if (t.type === "PIP") return "Performance plan";
    if (t.meetingId) return "Meeting action";
    return "Manual";
  }

  const visible = useMemo(
    () =>
      tasks.filter((t) => {
        if (filterEmployee && t.employee?.id !== filterEmployee) return false;
        if (filterType && typeOf(t) !== filterType) return false;
        return true;
      }),
    [tasks, filterEmployee, filterType]
  );

  const byStatus = useMemo(() => {
    const map: Record<TaskStatus, TaskData[]> = { TODO: [], IN_PROGRESS: [], DONE: [] };
    for (const t of visible) map[t.status].push(t);
    return map;
  }, [visible]);

  async function updateStatus(taskId: string, status: TaskStatus) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, status }),
    });
  }

  async function submit() {
    if (!form.title.trim()) return;
    if (manager && !form.employeeId) return;
    setSaving(true);
    try {
      if (form.isPip && manager) {
        const res = await fetch("/api/performance-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employeeId: form.employeeId, title: form.title.trim() }),
        });
        if (res.ok) {
          const plan = await res.json();
          if (plan?.task) {
            // Refresh the managed list so the new PIP task appears.
            const t = await fetch("/api/tasks?scope=managed").then((r) => r.json());
            setTasks(Array.isArray(t) ? t : []);
          }
        }
      } else {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId: manager ? form.employeeId : undefined,
            title: form.title.trim(),
            assigneeId: manager ? (form.assigneeId || null) : null,
            dueDate: form.dueDate || null,
            visibility: manager ? form.visibility : "SHARED",
          }),
        });
        if (res.ok) { const created = await res.json(); setTasks((prev) => [created, ...prev]); }
      }
      setForm({ employeeId: "", title: "", assigneeId: "", dueDate: "", visibility: "SHARED", isPip: false });
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  if (!role) return <div className="text-center py-12 text-gray-500">Loading…</div>;
  if (loading) return <div className="text-center py-12 text-gray-500">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-visory-navy">Tasks</h1>
          <p className="text-sm text-gray-600 mt-1">
            {manager ? "Tasks across your team — from meetings, plans, or added directly." : "Your tasks and meeting actions."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {manager && (
            <>
              <select
                value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-visory"
              >
                <option value="">All employees</option>
                {reports.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-visory"
              >
                <option value="">All types</option>
                <option value="Manual">Manual</option>
                <option value="Meeting action">Meeting action</option>
                <option value="Performance plan">Performance plan</option>
              </select>
            </>
          )}
          {!showForm && <Button size="sm" onClick={() => setShowForm(true)}>Add Task</Button>}
        </div>
      </div>

      {showForm && (
        <Card>
          <CardContent className="py-4 space-y-3">
            {manager && (
              <select
                value={form.employeeId}
                onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value, assigneeId: "" }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-visory"
              >
                <option value="">Select team member…</option>
                {reports.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            )}
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder={form.isPip ? "Plan title (e.g. Performance Improvement Plan)" : "Task"}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-visory"
            />
            {!form.isPip && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {manager && (
                  <select
                    value={form.assigneeId}
                    onChange={(e) => setForm((f) => ({ ...f, assigneeId: e.target.value }))}
                    className="rounded-lg border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-visory"
                  >
                    <option value="">Unassigned</option>
                    {assigneeOptions.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                )}
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  className="rounded-lg border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-visory"
                />
              </div>
            )}
            {manager && (
              <div className="flex flex-wrap items-center gap-4">
                {!form.isPip && (
                  <label className="flex items-center gap-1.5 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={form.visibility === "MANAGER_ONLY"}
                      onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.checked ? "MANAGER_ONLY" : "SHARED" }))}
                      className="rounded border-gray-300 text-visory focus:ring-visory"
                    />
                    Only visible to me (manager-only)
                  </label>
                )}
                <label className="flex items-center gap-1.5 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={form.isPip}
                    onChange={(e) => setForm((f) => ({ ...f, isPip: e.target.checked }))}
                    className="rounded border-gray-300 text-visory focus:ring-visory"
                  />
                  Performance Improvement Plan
                </label>
              </div>
            )}
            {form.isPip && (
              <p className="text-xs text-gray-500">
                This creates a manager-only PIP. Manage its performance meetings, notes, and actions from the employee&apos;s profile.
              </p>
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={submit} disabled={saving || !form.title.trim() || (manager && !form.employeeId)}>
                {saving ? "Saving…" : form.isPip ? "Start Plan" : "Save Task"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kanban: To Do / In Progress / Done */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STATUS_ORDER.map((col) => {
          const items = byStatus[col];
          return (
            <div key={col}>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-sm font-semibold text-visory-navy">{STATUS_LABELS[col]}</span>
                <Badge className={statusColor(col)}>{items.length}</Badge>
              </div>
              <div className="rounded-lg bg-gray-50 p-2 space-y-2 min-h-[120px]">
                {items.map((task) => (
                  <div key={task.id} className="rounded-lg border border-gray-200 bg-white p-3">
                    <p className={`text-sm font-medium text-visory-navy ${task.status === "DONE" ? "line-through opacity-60" : ""}`}>
                      {task.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {manager && task.employee && (
                        <a href={`/team/${task.employee.id}`} className="text-xs text-visory hover:text-visory-dark font-medium">
                          {task.employee.name}
                        </a>
                      )}
                      <span className="text-xs text-gray-500">{task.assignee?.name ?? "Unassigned"}</span>
                      {task.dueDate && (
                        <span className="text-xs text-gray-400">
                          Due {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                      <TaskSourceBadge task={task} canSeeMeeting={manager} />
                      <TaskVisibilityBadge task={task} />
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <select
                        value={task.status}
                        onChange={(e) => updateStatus(task.id, e.target.value as TaskStatus)}
                        className={`rounded-lg border px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-visory ${statusColor(task.status)}`}
                      >
                        {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                      </select>
                      <button
                        onClick={() => setExpanded(expanded === task.id ? null : task.id)}
                        className="text-xs text-visory hover:text-visory-dark font-medium"
                      >
                        {expanded === task.id ? "Hide" : "Comments"}
                      </button>
                    </div>
                    {expanded === task.id && <TaskComments taskId={task.id} />}
                  </div>
                ))}
                {items.length === 0 && <p className="text-xs text-gray-400 text-center py-4">None</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
