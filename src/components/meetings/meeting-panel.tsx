"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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

interface MeetingPanelProps {
  assessmentId: string;
  employeeId: string;
  employeeName: string;
  assigneeOptions: AssigneeOption[];
  onClose: () => void;
  onCompleted?: () => void;
}

function emptyRow(employeeId: string): ActionRow {
  return { title: "", assigneeId: employeeId, dueDate: "" };
}

export function MeetingPanel({
  assessmentId,
  employeeId,
  employeeName,
  assigneeOptions,
  onClose,
  onCompleted,
}: MeetingPanelProps) {
  const [meeting, setMeeting] = useState<MeetingData | null>(null);
  const [notes, setNotes] = useState("");
  const [existingTasks, setExistingTasks] = useState<TaskData[]>([]);
  const [rows, setRows] = useState<ActionRow[]>([emptyRow(employeeId)]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      // Save notes (and optionally complete the meeting).
      await fetch(`/api/meetings/${meeting.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, complete }),
      });

      // Turn each filled-in action row into a task.
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

      if (complete) {
        onCompleted?.();
        onClose();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-visory-navy">1:1 Meeting — {employeeName}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-center text-gray-500">Loading…</div>
        ) : (
          <div className="px-6 py-4 space-y-5">
            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-visory-navy mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Discussion notes, context shared, decisions…"
                rows={5}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-visory focus:border-visory"
              />
            </div>

            {/* Existing tasks from this meeting */}
            {existingTasks.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Actions already created</p>
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
              </div>
            )}

            {/* New action rows */}
            <div>
              <label className="block text-sm font-medium text-visory-navy mb-1">
                Actions <span className="text-xs font-normal text-gray-500">(each becomes a task)</span>
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
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4 sticky bottom-0 bg-white">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>Close</Button>
          <Button variant="secondary" size="sm" onClick={() => persist(false)} disabled={saving || loading}>
            {saving ? "Saving…" : "Save"}
          </Button>
          <Button size="sm" onClick={() => persist(true)} disabled={saving || loading}>
            {saving ? "Saving…" : "Complete Meeting"}
          </Button>
        </div>
      </div>
    </div>
  );
}
