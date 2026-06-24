"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { MeetingData, TaskData } from "@/types";

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

  if (loading) return <div className="text-center py-12 text-gray-500">Loading meeting…</div>;

  return (
    <div className="space-y-5">
      {completed && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-4">
          <p className="text-sm font-semibold text-green-800">This meeting is marked complete.</p>
          <p className="text-sm text-green-700">You can still edit the notes and add follow-up actions below.</p>
        </div>
      )}

      {/* Notes */}
      <Card>
        <CardContent className="py-4">
          <label className="block text-sm font-medium text-visory-navy mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Discussion notes, context shared, decisions…"
            rows={8}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-visory focus:border-visory"
          />
        </CardContent>
      </Card>

      {/* Existing tasks */}
      {existingTasks.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Actions from this meeting</p>
            <div className="space-y-1">
              {existingTasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between text-sm rounded-lg bg-gray-50 px-3 py-1.5">
                  <span className="text-visory-navy">{t.title}</span>
                  <span className="text-xs text-gray-500">
                    {t.assignee?.name ?? "Unassigned"}
                    {t.dueDate ? ` · ${new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* New action rows */}
      <Card>
        <CardContent className="py-4">
          <label className="block text-sm font-medium text-visory-navy mb-2">
            Add actions <span className="text-xs font-normal text-gray-500">(each becomes a task)</span>
          </label>
          <div className="space-y-2">
            {rows.map((row, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  value={row.title}
                  onChange={(e) => updateRow(i, { title: e.target.value })}
                  placeholder="Agreed action…"
                  className="sm:col-span-6 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-visory"
                />
                <select
                  value={row.assigneeId}
                  onChange={(e) => updateRow(i, { assigneeId: e.target.value })}
                  className="sm:col-span-3 rounded-lg border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-visory"
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
                  className="sm:col-span-2 rounded-lg border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-visory"
                />
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="sm:col-span-1 text-gray-400 hover:text-red-500 text-sm"
                  aria-label="Remove action"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="mt-2" onClick={addRow}>+ Add action</Button>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        {savedAt && <span className="text-xs text-gray-400">Saved at {savedAt}</span>}
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
