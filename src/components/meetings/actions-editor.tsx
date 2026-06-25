"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, X, ArrowUpRight } from "lucide-react";
import type { TaskData } from "@/types";

const fieldClass =
  "w-full rounded-lg border border-line-2 bg-paper-2 px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-magenta focus:ring-2 focus:ring-magenta/20";

interface AssigneeOption {
  id: string;
  name: string;
}

interface ActionRow {
  title: string;
  assigneeId: string;
  dueDate: string;
}

interface ActionsEditorProps {
  employeeId: string;
  assigneeOptions: AssigneeOption[];
  /** attach newly created actions to this meeting */
  meetingId?: string;
  /** when set, only actions from this assessment's meeting are listed */
  assessmentId?: string;
  /** read-only: hide the add-action form (e.g. on a closed cycle) */
  readOnly?: boolean;
  onCreated?: (task: TaskData) => void;
}

function emptyRow(employeeId: string): ActionRow {
  return { title: "", assigneeId: employeeId, dueDate: "" };
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Shared "Actions" block: lists the tasks agreed for an employee (each links
 * through to the Tasks board) and lets a manager add new ones. Every action is
 * a Task — created via POST /api/tasks with an optional meeting link.
 */
export function ActionsEditor({
  employeeId,
  assigneeOptions,
  meetingId,
  assessmentId,
  readOnly,
  onCreated,
}: ActionsEditorProps) {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [rows, setRows] = useState<ActionRow[]>([emptyRow(employeeId)]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/tasks?employeeId=${employeeId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setTasks(Array.isArray(d) ? d : []))
      .catch(() => setTasks([]))
      .finally(() => setLoaded(true));
  }, [employeeId]);

  const shown = assessmentId
    ? tasks.filter((t) => t.meeting?.managerAssessmentId === assessmentId)
    : tasks;

  function updateRow(i: number, patch: Partial<ActionRow>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setRows((prev) => [...prev, emptyRow(employeeId)]);
  }
  function removeRow(i: number) {
    setRows((prev) => (prev.length === 1 ? [emptyRow(employeeId)] : prev.filter((_, idx) => idx !== i)));
  }

  async function saveRows() {
    setSaving(true);
    try {
      const created: TaskData[] = [];
      for (const row of rows) {
        if (!row.title.trim()) continue;
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId,
            title: row.title.trim(),
            assigneeId: row.assigneeId || null,
            dueDate: row.dueDate || null,
            meetingId: meetingId || null,
          }),
        });
        if (res.ok) {
          const t: TaskData = await res.json();
          created.push(t);
          onCreated?.(t);
        }
      }
      if (created.length) setTasks((prev) => [...prev, ...created]);
      setRows([emptyRow(employeeId)]);
    } finally {
      setSaving(false);
    }
  }

  const hasDraft = rows.some((r) => r.title.trim());

  return (
    <div>
      <div className="eyebrow mb-2">
        Actions <span className="muted normal-case">· each becomes a task</span>
      </div>

      {loaded && shown.length > 0 && (
        <div className="space-y-1 mb-3">
          {shown.map((t) => (
            <Link
              key={t.id}
              href="/tasks"
              className="group flex items-center justify-between gap-2 rounded-lg bg-paper-2 px-3 py-1.5 transition-colors hover:bg-line/40"
            >
              <span className="flex items-center gap-2 text-sm text-ink min-w-0">
                <span
                  className={`shrink-0 ${t.status === "DONE" ? "text-success" : "text-ink-4"}`}
                  aria-hidden
                >
                  {t.status === "DONE" ? "●" : "○"}
                </span>
                <span className="truncate">{t.title}</span>
              </span>
              <span className="mono tnum text-xs muted inline-flex items-center gap-1 shrink-0">
                {t.assignee?.name ?? "Unassigned"}
                {t.dueDate ? ` · ${fmtDate(t.dueDate)}` : ""}
                <ArrowUpRight size={12} className="opacity-0 transition-opacity group-hover:opacity-100" />
              </span>
            </Link>
          ))}
        </div>
      )}

      {!readOnly && (
        <>
          <div className="space-y-2">
            {rows.map((row, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  value={row.title}
                  onChange={(e) => updateRow(i, { title: e.target.value })}
                  placeholder="Agreed action…"
                  className={`sm:col-span-6 ${fieldClass}`}
                />
                <select
                  value={row.assigneeId}
                  onChange={(e) => updateRow(i, { assigneeId: e.target.value })}
                  className={`sm:col-span-3 ${fieldClass}`}
                >
                  <option value="">Unassigned</option>
                  {assigneeOptions.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={row.dueDate}
                  onChange={(e) => updateRow(i, { dueDate: e.target.value })}
                  className={`sm:col-span-2 ${fieldClass}`}
                />
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="sm:col-span-1 inline-flex items-center justify-center text-ink-4 hover:text-magenta-2 transition-colors"
                  aria-label="Remove action"
                >
                  <X size={16} strokeWidth={1.6} />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" className="inline-flex items-center gap-1" onClick={addRow}>
              <Plus size={14} strokeWidth={1.6} /> Add action
            </Button>
            <Button size="sm" onClick={saveRows} disabled={saving || !hasDraft}>
              {saving ? "Saving…" : "Save actions"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
