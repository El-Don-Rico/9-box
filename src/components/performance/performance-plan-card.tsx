"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/toggle";
import type { PerformancePlanData, PerformanceMeetingData, PerformanceActionData } from "@/types";

interface ActionRow { title: string; dueDate: string }

const FIELD =
  "w-full rounded-lg border border-line-2 bg-paper-2 px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:border-magenta focus:ring-2 focus:ring-magenta/20 focus:outline-none";

function MeetingActions({ meeting, onChange }: { meeting: PerformanceMeetingData; onChange: (m: PerformanceMeetingData) => void }) {
  const [newAction, setNewAction] = useState("");

  async function toggle(action: PerformanceActionData) {
    const res = await fetch("/api/performance-actions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionId: action.id, done: !action.done }),
    });
    if (res.ok) {
      const updated = await res.json();
      onChange({ ...meeting, actions: (meeting.actions || []).map((a) => (a.id === updated.id ? updated : a)) });
    }
  }

  async function add() {
    if (!newAction.trim()) return;
    const res = await fetch("/api/performance-actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingId: meeting.id, title: newAction.trim() }),
    });
    if (res.ok) {
      const created = await res.json();
      onChange({ ...meeting, actions: [...(meeting.actions || []), created] });
      setNewAction("");
    }
  }

  return (
    <div className="mt-2 space-y-1.5">
      {(meeting.actions || []).map((a) => (
        <div key={a.id} className="flex items-center gap-2 text-sm">
          <Checkbox checked={a.done} onChange={() => toggle(a)} />
          <span className={a.done ? "line-through muted-2" : "text-ink"}>{a.title}</span>
          {a.dueDate && <span className="mono tnum text-xs muted-2">· {new Date(a.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <input
          value={newAction}
          onChange={(e) => setNewAction(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") add(); }}
          placeholder="Add an action…"
          className={`flex-1 ${FIELD} py-1.5`}
        />
        <Button size="sm" variant="secondary" onClick={add} disabled={!newAction.trim()}>Add</Button>
      </div>
    </div>
  );
}

export function PerformancePlanCard({ employeeId, employeeName }: { employeeId: string; employeeName: string }) {
  const [plan, setPlan] = useState<PerformancePlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{ title: string; meetingDate: string; notes: string; actions: ActionRow[] }>({
    title: "", meetingDate: "", notes: "", actions: [{ title: "", dueDate: "" }],
  });

  useEffect(() => {
    fetch(`/api/performance-plans?employeeId=${employeeId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => { setPlan(p); setLoading(false); })
      .catch(() => setLoading(false));
  }, [employeeId]);

  async function startPlan() {
    setStarting(true);
    try {
      const res = await fetch("/api/performance-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId }),
      });
      if (res.ok) setPlan(await res.json());
    } finally {
      setStarting(false);
    }
  }

  async function addMeeting() {
    if (!plan || !form.title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/performance-meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          title: form.title.trim(),
          notes: form.notes || null,
          meetingDate: form.meetingDate || null,
          actions: form.actions.filter((a) => a.title.trim()).map((a) => ({ title: a.title.trim(), dueDate: a.dueDate || null })),
        }),
      });
      if (res.ok) {
        const meeting = await res.json();
        setPlan({ ...plan, meetings: [meeting, ...(plan.meetings || [])] });
        setForm({ title: "", meetingDate: "", notes: "", actions: [{ title: "", dueDate: "" }] });
        setShowForm(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function closePlan() {
    if (!plan) return;
    const res = await fetch("/api/performance-plans", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: plan.id, status: "COMPLETED" }),
    });
    if (res.ok) setPlan(null);
  }

  function updateMeeting(updated: PerformanceMeetingData) {
    setPlan((p) => (p ? { ...p, meetings: (p.meetings || []).map((m) => (m.id === updated.id ? updated : m)) } : p));
  }

  if (loading) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Performance Improvement Plan</CardTitle>
          <Badge variant="navy">Manager only</Badge>
        </div>
        {plan ? (
          <Button size="sm" variant="ghost" onClick={closePlan}>Close plan</Button>
        ) : (
          <Button size="sm" onClick={startPlan} disabled={starting}>
            {starting ? "Starting…" : "Start PIP"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!plan ? (
          <p className="text-sm muted">
            No active plan for {employeeName}. Starting a PIP creates a manager-only task and a space to log performance management meetings, notes, and actions — not visible to the employee.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="eyebrow">Performance management meetings</p>
              {!showForm && <Button size="sm" variant="secondary" onClick={() => setShowForm(true)}>Add meeting</Button>}
            </div>

            {showForm && (
              <div className="rounded-lg border border-line p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Meeting title (e.g. Week 1 check-in)"
                    className={FIELD}
                  />
                  <input
                    type="date"
                    value={form.meetingDate}
                    onChange={(e) => setForm((f) => ({ ...f, meetingDate: e.target.value }))}
                    className={`mono tnum ${FIELD}`}
                  />
                </div>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Notes…"
                  rows={3}
                  className={FIELD}
                />
                <div className="space-y-2">
                  {form.actions.map((row, i) => (
                    <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <input
                        type="text"
                        value={row.title}
                        onChange={(e) => setForm((f) => ({ ...f, actions: f.actions.map((a, idx) => idx === i ? { ...a, title: e.target.value } : a) }))}
                        placeholder="Action…"
                        className={`sm:col-span-8 ${FIELD}`}
                      />
                      <input
                        type="date"
                        value={row.dueDate}
                        onChange={(e) => setForm((f) => ({ ...f, actions: f.actions.map((a, idx) => idx === i ? { ...a, dueDate: e.target.value } : a) }))}
                        className={`mono tnum sm:col-span-4 ${FIELD}`}
                      />
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" onClick={() => setForm((f) => ({ ...f, actions: [...f.actions, { title: "", dueDate: "" }] }))}>
                    + Add action
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={addMeeting} disabled={saving || !form.title.trim()}>
                    {saving ? "Saving…" : "Save meeting"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </div>
            )}

            {(plan.meetings || []).length === 0 ? (
              <p className="text-sm muted-2">No performance meetings logged yet.</p>
            ) : (
              <div className="space-y-3">
                {(plan.meetings || []).map((m) => (
                  <div key={m.id} className="rounded-lg border border-line p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-ink">{m.title}</p>
                      {m.meetingDate && (
                        <span className="mono tnum text-xs muted-2">
                          {new Date(m.meetingDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      )}
                    </div>
                    {m.notes && <p className="text-sm muted mt-1 whitespace-pre-wrap">{m.notes}</p>}
                    <MeetingActions meeting={m} onChange={updateMeeting} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
