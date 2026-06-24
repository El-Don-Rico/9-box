"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, X } from "lucide-react";
import type { MeetingData, TaskData } from "@/types";

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

interface MeetingEditorProps {
  assessmentId: string;
  employeeId: string;
  assigneeOptions: AssigneeOption[];
  onDone?: () => void;
}

function emptyRow(employeeId: string): ActionRow {
  return { title: "", assigneeId: employeeId, dueDate: "" };
}

export function MeetingEditor({
  assessmentId,
  employeeId,
  assigneeOptions,
  onDone,
}: MeetingEditorProps) {
  const [meeting, setMeeting] = useState<MeetingData | null>(null);
  const [notes, setNotes] = useState("");
  const [existingTasks, setExistingTasks] = useState<TaskData[]>([]);
  const [rows, setRows] = useState<ActionRow[]>([emptyRow(employeeId)]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    // Start (or re-open) the meeting and load its current notes + tasks.
    fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessmentId }),
    })
      .then((r) => r.json())
      .then((m: MeetingData) => {
        setMeeting(m);
        setNotes(m.notes || "");
        setExistingTasks(m.tasks || []);
        setCompleted(!!m.completedAt);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [assessmentId]);

  function updateRow(i: number, patch: Partial<ActionRow>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setRows((prev) => [...prev, emptyRow(employeeId)]);
  }
  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function persist(complete: boolean) {
    if (!meeting) return;
    setSaving(true);
    try {
      await fetch(`/api/meetings/${meeting.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, complete }),
      });

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
            meetingId: meeting.id,
          }),
        });
        if (res.ok) created.push(await res.json());
      }
      setExistingTasks((prev) => [...prev, ...created]);
      setRows([emptyRow(employeeId)]);
      setSavedAt(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));
      if (complete) {
        setCompleted(true);
        onDone?.();
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-center py-12 muted">Loading meeting…</div>;

  return (
    <div className="space-y-5">
      {completed && (
        <div className="rounded-lg border border-success/40 bg-success/10 p-4">
          <p className="text-sm font-semibold text-success">This meeting is marked complete.</p>
          <p className="text-sm text-ink-2">You can still edit the notes and add follow-up actions below.</p>
        </div>
      )}

      {/* Notes */}
      <Card>
        <label className="eyebrow block mb-1.5">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Discussion notes, context shared, decisions…"
          rows={8}
          className={fieldClass}
        />
      </Card>

      {/* Existing tasks */}
      {existingTasks.length > 0 && (
        <Card>
          <p className="eyebrow mb-2">Actions from this meeting</p>
          <div className="space-y-1">
            {existingTasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm rounded-lg bg-paper-2 px-3 py-1.5">
                <span className="text-ink">{t.title}</span>
                <span className="mono tnum text-xs muted">
                  {t.assignee?.name ?? "Unassigned"}
                  {t.dueDate ? ` · ${new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* New action rows */}
      <Card>
        <label className="eyebrow block mb-2">
          Add actions <span className="muted normal-case">(each becomes a task)</span>
        </label>
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
        <Button variant="ghost" size="sm" className="mt-2 inline-flex items-center gap-1" onClick={addRow}>
          <Plus size={14} strokeWidth={1.6} /> Add action
        </Button>
      </Card>

      <div className="flex items-center justify-end gap-3">
        {savedAt && <span className="mono tnum text-xs muted">Saved at {savedAt}</span>}
        <Button variant="secondary" onClick={() => persist(false)} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        {!completed && (
          <Button onClick={() => persist(true)} disabled={saving}>
            {saving ? "Saving…" : "Complete Meeting"}
          </Button>
        )}
      </div>
    </div>
  );
}
