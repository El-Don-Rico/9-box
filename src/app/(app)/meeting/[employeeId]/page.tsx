"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MeetingData, TaskData } from "@/types";

export default function MeetingPage({ params }: { params: Promise<{ employeeId: string }> }) {
  const { employeeId } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const cycleId = searchParams.get("cycleId");
  const type = (searchParams.get("type") === "PIP" ? "PIP" : "ONE_ON_ONE") as "ONE_ON_ONE" | "PIP";

  const [employeeName, setEmployeeName] = useState("");
  const [meeting, setMeeting] = useState<MeetingData | null>(null);
  const [notes, setNotes] = useState("");
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);

  const [actionTitle, setActionTitle] = useState("");
  const [actionDue, setActionDue] = useState("");
  const [addingAction, setAddingAction] = useState(false);

  const isPip = type === "PIP";

  const loadMeeting = useCallback(async () => {
    const qs = new URLSearchParams({ employeeId, type });
    if (cycleId) qs.set("cycleId", cycleId);
    const res = await fetch(`/api/meetings?${qs.toString()}`);
    if (res.ok) {
      const data: MeetingData[] = await res.json();
      const existing = data[0] ?? null;
      setMeeting(existing);
      setNotes(existing?.notes ?? "");
      setTasks(existing?.tasks ?? []);
    }
  }, [employeeId, cycleId, type]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/employees/${employeeId}`).then((r) => (r.ok ? r.json() : null)),
      loadMeeting(),
    ])
      .then(([emp]) => {
        if (emp?.employee) setEmployeeName(emp.employee.name);
      })
      .finally(() => setLoading(false));
  }, [employeeId, loadMeeting]);

  async function startMeeting() {
    setSaving(true);
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, cycleId, type }),
      });
      if (res.ok) {
        const m: MeetingData = await res.json();
        setMeeting(m);
        setNotes(m.notes ?? "");
        setTasks(m.tasks ?? []);
      }
    } finally {
      setSaving(false);
    }
  }

  async function saveNotes() {
    if (!meeting) return;
    setSaving(true);
    try {
      const res = await fetch("/api/meetings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId: meeting.id, notes }),
      });
      if (res.ok) setMeeting(await res.json());
    } finally {
      setSaving(false);
    }
  }

  async function completeMeeting() {
    if (!meeting) return;
    setCompleting(true);
    try {
      const res = await fetch("/api/meetings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId: meeting.id, notes, status: "COMPLETE" }),
      });
      if (res.ok) {
        setMeeting(await res.json());
      }
    } finally {
      setCompleting(false);
    }
  }

  async function addAction() {
    if (!actionTitle.trim() || !meeting) return;
    setAddingAction(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: actionTitle.trim(),
          assigneeId: employeeId,
          dueDate: actionDue || null,
          category: isPip ? "PIP" : "1:1 Action",
          meetingId: meeting.id,
        }),
      });
      if (res.ok) {
        const task: TaskData = await res.json();
        setTasks((prev) => [...prev, task]);
        setActionTitle("");
        setActionDue("");
      }
    } finally {
      setAddingAction(false);
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  const isComplete = meeting?.status === "COMPLETE";

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-2">
      <div>
        <button onClick={() => router.back()} className="text-xs text-visory hover:text-visory-dark font-medium mb-2">
          ← Back
        </button>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-visory-navy">
            {isPip ? "Performance Improvement Plan" : "1:1 Meeting"}
          </h1>
          {isComplete && <Badge className="bg-green-100 text-green-800 border-green-300">Complete</Badge>}
          {isPip && <Badge className="bg-red-50 text-red-700 border-red-200">Manager only</Badge>}
        </div>
        {employeeName && <p className="text-sm text-gray-600 mt-1">{employeeName}</p>}
      </div>

      {!meeting ? (
        <Card>
          <CardContent className="py-6 text-center space-y-4">
            <p className="text-sm text-gray-600">
              {isPip
                ? "Start a performance improvement plan meeting to record notes and actions for this employee."
                : "Start the meeting to capture notes and agree on actions. Notes are optional."}
            </p>
            <Button onClick={startMeeting} disabled={saving}>
              {saving ? "Starting..." : "Start Meeting"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Notes */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Meeting Notes</h2>
              <p className="text-xs text-gray-500">
                {isPip ? "Private to managers. Not visible to the employee." : "Context from your 1:1. Not visible to the employee until results are shared."}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Key takeaways, context shared, decisions made..."
                rows={8}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-visory focus:border-visory"
              />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={saveNotes} disabled={saving}>
                  {saving ? "Saving..." : "Save Notes"}
                </Button>
                {!isComplete && (
                  <Button size="sm" variant="secondary" onClick={completeMeeting} disabled={completing}>
                    {completing ? "Completing..." : "Mark Meeting Complete"}
                  </Button>
                )}
                {isComplete && (
                  <Button size="sm" variant="ghost" onClick={() => completeMeeting()} disabled>
                    Completed{meeting.completedAt ? ` · ${new Date(meeting.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions → Tasks */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Actions</h2>
              <p className="text-xs text-gray-500">Actions become tasks assigned to {employeeName || "the employee"}.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasks.length > 0 ? (
                <div className="space-y-2">
                  {tasks.map((t) => (
                    <div key={t.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                      <div>
                        <p className="text-sm text-visory-navy">{t.title}</p>
                        {t.dueDate && (
                          <p className="text-[11px] text-gray-400">
                            Due {new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </p>
                        )}
                      </div>
                      <Badge
                        className={
                          t.status === "COMPLETE"
                            ? "bg-green-100 text-green-800 border-green-300"
                            : t.status === "IN_PROGRESS"
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : "bg-gray-100 text-gray-600 border-gray-300"
                        }
                      >
                        {t.status === "COMPLETE" ? "Complete" : t.status === "IN_PROGRESS" ? "In Progress" : "To Do"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No actions yet.</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <input
                  type="text"
                  value={actionTitle}
                  onChange={(e) => setActionTitle(e.target.value)}
                  placeholder="Action to assign…"
                  className="sm:col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-visory"
                />
                <input
                  type="date"
                  value={actionDue}
                  onChange={(e) => setActionDue(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-visory"
                />
              </div>
              <Button size="sm" onClick={addAction} disabled={addingAction || !actionTitle.trim()}>
                {addingAction ? "Adding..." : "Add Action"}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
