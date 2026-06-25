"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ActionsEditor } from "@/components/meetings/actions-editor";
import type { MeetingData } from "@/types";

const fieldClass =
  "w-full rounded-lg border border-line-2 bg-paper-2 px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-magenta focus:ring-2 focus:ring-magenta/20";

interface AssigneeOption {
  id: string;
  name: string;
}

interface MeetingEditorProps {
  assessmentId: string;
  employeeId: string;
  assigneeOptions: AssigneeOption[];
  onDone?: () => void;
}

export function MeetingEditor({
  assessmentId,
  employeeId,
  assigneeOptions,
  onDone,
}: MeetingEditorProps) {
  const [meeting, setMeeting] = useState<MeetingData | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    // Start (or re-open) the meeting and load its current notes.
    fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessmentId }),
    })
      .then((r) => r.json())
      .then((m: MeetingData) => {
        setMeeting(m);
        setNotes(m.notes || "");
        setCompleted(!!m.completedAt);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [assessmentId]);

  async function persist(complete: boolean) {
    if (!meeting) return;
    setSaving(true);
    try {
      await fetch(`/api/meetings/${meeting.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, complete }),
      });
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
        <div className="mt-3 flex items-center justify-end gap-3">
          {savedAt && <span className="mono tnum text-xs muted">Saved at {savedAt}</span>}
          <Button variant="secondary" onClick={() => persist(false)} disabled={saving}>
            {saving ? "Saving…" : "Save notes"}
          </Button>
          {!completed && (
            <Button onClick={() => persist(true)} disabled={saving}>
              {saving ? "Saving…" : "Complete Meeting"}
            </Button>
          )}
        </div>
      </Card>

      {/* Actions (each becomes a task linked to this meeting) */}
      {meeting && (
        <Card>
          <ActionsEditor
            employeeId={employeeId}
            assigneeOptions={assigneeOptions}
            meetingId={meeting.id}
            assessmentId={assessmentId}
          />
        </Card>
      )}
    </div>
  );
}
