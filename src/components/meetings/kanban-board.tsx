"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  MEETING_STATUS_LABELS,
  MANAGER_SETTABLE_STATUSES,
  meetingStatusColor,
  getColumnTracking,
  TRACKING_META,
} from "@/lib/meeting";
import { getTenureBucket, TENURE_BUCKETS } from "@/lib/tenure";
import { getCycleDueDates, formatDueDate, type CyclePeriod, type CycleDueDates } from "@/lib/utils";
import type { TeamMemberStatus, MeetingStatus } from "@/types";

// The board adds a terminal "Review Complete" column beyond the meeting
// statuses: a card lands there once results have been sent (cycle closed).
type ColumnKey = MeetingStatus | "REVIEW_COMPLETE";

const COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "NOT_READY", label: MEETING_STATUS_LABELS.NOT_READY },
  { key: "READY_TO_MEET", label: MEETING_STATUS_LABELS.READY_TO_MEET },
  { key: "MEETING_SCHEDULED", label: MEETING_STATUS_LABELS.MEETING_SCHEDULED },
  { key: "MEETING_COMPLETE", label: MEETING_STATUS_LABELS.MEETING_COMPLETE },
  { key: "REVIEW_COMPLETE", label: "Review Complete" },
];

function columnColor(key: ColumnKey): string {
  if (key === "REVIEW_COMPLETE") return "bg-visory-light text-visory-dark border-visory/30";
  return meetingStatusColor(key);
}

function memberColumn(m: TeamMemberStatus): ColumnKey {
  if (m.resultsSentAt) return "REVIEW_COMPLETE";
  return m.meetingStatus ?? "NOT_READY";
}

// Compact, low-emphasis style shared by the card action buttons (meeting
// notes / send results) so they read as secondary to the card itself.
const CARD_ACTION_CLASS =
  "inline-flex items-center justify-center rounded-md border border-visory/40 bg-white px-2 py-1 text-xs font-medium text-visory transition-colors hover:bg-visory-light/50 focus:outline-none focus:ring-2 focus:ring-visory";

function openMeeting(assessmentId: string) {
  window.open(`/meeting/${assessmentId}`, "_blank", "noopener");
}

function CompletionDot({ done, label }: { done: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px]" title={`${label}: ${done ? "Done" : "Pending"}`}>
      <span className={done ? "text-green-600" : "text-gray-300"}>{done ? "●" : "○"}</span>
      <span className="text-gray-500">{label}</span>
    </span>
  );
}

function CardBody({ member, onOpenProfile }: { member: TeamMemberStatus; onOpenProfile?: (id: string) => void }) {
  return (
    <>
      {onOpenProfile ? (
        <button
          type="button"
          // Stop the pointer event from reaching the drag handle so the name
          // acts as a plain link to the profile instead of starting a drag.
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onOpenProfile(member.id)}
          className="text-left text-sm font-medium text-visory-navy hover:text-visory hover:underline"
        >
          {member.name}
        </button>
      ) : (
        <p className="text-sm font-medium text-visory-navy">{member.name}</p>
      )}
      {member.jobTitle && <p className="text-xs text-gray-500">{member.jobTitle}</p>}
    </>
  );
}

function MemberCard({
  member,
  column,
  due,
  now,
  onOpenProfile,
  onSendResults,
}: {
  member: TeamMemberStatus;
  column: ColumnKey;
  due: CycleDueDates | null;
  now: number;
  onOpenProfile: (id: string) => void;
  onSendResults: (member: TeamMemberStatus) => void;
}) {
  const closed = column === "REVIEW_COMPLETE";
  const settable = MANAGER_SETTABLE_STATUSES.includes(column as MeetingStatus);
  const draggable = settable && !closed;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: member.id,
    disabled: !draggable,
  });

  const tracking = due ? getColumnTracking(column, due, new Date(now)) : null;
  const tMeta = tracking ? TRACKING_META[tracking] : null;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }}
      className={`rounded-lg border p-2.5 shadow-sm ${closed ? "border-gray-200 bg-gray-50 opacity-70" : "border-gray-200 bg-white"}`}
    >
      <div className="flex items-start justify-between gap-1.5">
        <div
          {...(draggable ? { ...attributes, ...listeners } : {})}
          className={`min-w-0 flex-1 ${draggable ? "cursor-grab active:cursor-grabbing touch-none" : ""}`}
        >
          <CardBody member={member} onOpenProfile={onOpenProfile} />
        </div>
        {tMeta && (
          <span className={`shrink-0 text-xs leading-5 ${tMeta.className}`} title={tMeta.label}>
            {tMeta.icon}
          </span>
        )}
      </div>

      {/* Self / manager completion icons while the assessment is still underway */}
      {column === "NOT_READY" && (
        <div className="mt-1.5 flex items-center gap-2.5">
          <CompletionDot done={member.selfAssessmentStatus === "submitted"} label="Self" />
          <CompletionDot done={member.managerAssessmentStatus === "submitted"} label="Mgr" />
        </div>
      )}

      {closed ? (
        <div className="mt-3">
          <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">Closed · Results Sent</Badge>
        </div>
      ) : (
        (column === "MEETING_SCHEDULED" || column === "MEETING_COMPLETE") &&
        member.managerAssessmentId && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {column === "MEETING_SCHEDULED" && (
              <button type="button" className={CARD_ACTION_CLASS} onClick={() => openMeeting(member.managerAssessmentId!)}>
                {member.meetingStarted ? "Edit Meeting Notes" : "Start Meeting"}
              </button>
            )}
            {column === "MEETING_COMPLETE" && (
              <button type="button" className={CARD_ACTION_CLASS} onClick={() => onSendResults(member)}>
                Send Results
              </button>
            )}
          </div>
        )
      )}
    </div>
  );
}

function Column({
  column,
  label,
  members,
  due,
  now,
  dueDate,
  onOpenProfile,
  onSendResults,
}: {
  column: ColumnKey;
  label: string;
  members: TeamMemberStatus[];
  due: CycleDueDates | null;
  now: number;
  dueDate: Date | null;
  onOpenProfile: (id: string) => void;
  onSendResults: (member: TeamMemberStatus) => void;
}) {
  // Only the three meeting statuses accept drops; NOT_READY and the terminal
  // REVIEW_COMPLETE column do not.
  const droppable = MANAGER_SETTABLE_STATUSES.includes(column as MeetingStatus);
  const { setNodeRef, isOver } = useDroppable({ id: column, disabled: !droppable });
  // Keep columns compact; once a column holds more than 5 cards it scrolls.
  const scroll = members.length > 5;

  return (
    <div className="flex-1 min-w-[210px]">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="min-w-0">
          <span className="text-sm font-semibold text-visory-navy">{label}</span>
          {dueDate && <p className="text-[11px] text-gray-400">by {formatDueDate(dueDate)}</p>}
        </div>
        <Badge className={columnColor(column)}>{members.length}</Badge>
      </div>
      <div
        ref={setNodeRef}
        className={`rounded-lg p-2 space-y-2 min-h-[140px] transition-colors ${
          scroll ? "max-h-[26rem] overflow-y-auto" : ""
        } ${isOver && droppable ? "bg-visory-light/60 ring-2 ring-visory" : "bg-gray-50"}`}
      >
        {members.map((m) => (
          <MemberCard
            key={m.id}
            member={m}
            column={column}
            due={due}
            now={now}
            onOpenProfile={onOpenProfile}
            onSendResults={onSendResults}
          />
        ))}
        {members.length === 0 && <p className="text-xs text-gray-400 text-center py-4">None</p>}
      </div>
    </div>
  );
}

function SendResultsModal({ memberName, onConfirm, onCancel, busy }: { memberName: string; onConfirm: () => void; onCancel: () => void; busy: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-visory-navy mb-2">Send Results to {memberName}?</h3>
        <p className="text-sm text-gray-600 mb-4">
          This closes out the cycle for {memberName}: the manager assessment becomes visible to them and the card moves to Review Complete. This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={busy}>Cancel</Button>
          <Button size="sm" onClick={onConfirm} disabled={busy}>{busy ? "Sending…" : "Confirm & Send"}</Button>
        </div>
      </div>
    </div>
  );
}

function CycleTimeline({ due }: { due: CycleDueDates }) {
  const now = Date.now();
  const milestones = [
    { label: "Ready to Meet", date: due.readyToMeet },
    { label: "Meeting Complete", date: due.meetingComplete },
    { label: "Results & Review", date: due.resultsSent },
  ];
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
      <p className="text-xs font-medium text-gray-500 uppercase mb-3">Cycle Timeline</p>
      <div className="flex items-center">
        {milestones.map((m, i) => {
          const passed = now > m.date.getTime();
          return (
            <div key={m.label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center text-center">
                <span className={`w-3 h-3 rounded-full ${passed ? "bg-green-500" : "bg-visory"}`} />
                <span className="text-xs font-medium text-visory-navy mt-1 whitespace-nowrap">{m.label}</span>
                <span className="text-[11px] text-gray-500">by {formatDueDate(m.date)}</span>
              </div>
              {i < milestones.length - 1 && <div className="flex-1 h-0.5 bg-gray-200 mx-2 mt-[-22px]" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function KanbanBoard({ members, cycle }: { members: TeamMemberStatus[]; cycle?: CyclePeriod | null }) {
  const router = useRouter();
  const [items, setItems] = useState<TeamMemberStatus[]>(members);
  const [selectedTitles, setSelectedTitles] = useState<string[]>([]);
  const [selectedTenures, setSelectedTenures] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sendTarget, setSendTarget] = useState<TeamMemberStatus | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setItems(members);
  }, [members]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  const titleOptions = useMemo(
    () => [...new Set(items.map((m) => m.jobTitle).filter(Boolean) as string[])].sort(),
    [items]
  );

  const filtered = useMemo(() => {
    return items.filter((m) => {
      if (selectedTitles.length > 0 && (!m.jobTitle || !selectedTitles.includes(m.jobTitle))) return false;
      if (selectedTenures.length > 0) {
        const bucket = getTenureBucket(m.startDate);
        if (!bucket || !selectedTenures.includes(bucket)) return false;
      }
      return true;
    });
  }, [items, selectedTitles, selectedTenures]);

  const byColumn = useMemo(() => {
    const map: Record<ColumnKey, TeamMemberStatus[]> = {
      NOT_READY: [], READY_TO_MEET: [], MEETING_SCHEDULED: [], MEETING_COMPLETE: [], REVIEW_COMPLETE: [],
    };
    for (const m of filtered) map[memberColumn(m)].push(m);
    return map;
  }, [filtered]);

  async function changeStatus(employeeId: string, status: MeetingStatus) {
    const member = items.find((m) => m.id === employeeId);
    if (!member?.managerAssessmentId || member.resultsSentAt || member.meetingStatus === status) return;
    const prev = member.meetingStatus;
    setItems((ms) => ms.map((m) => (m.id === employeeId ? { ...m, meetingStatus: status } : m)));
    const res = await fetch("/api/meetings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessmentId: member.managerAssessmentId, meetingStatus: status }),
    });
    if (!res.ok) setItems((ms) => ms.map((m) => (m.id === employeeId ? { ...m, meetingStatus: prev } : m)));
  }

  async function confirmSendResults() {
    if (!sendTarget?.managerAssessmentId) return;
    setSending(true);
    try {
      const res = await fetch("/api/assessments/manager/send-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId: sendTarget.managerAssessmentId }),
      });
      if (res.ok) {
        const id = sendTarget.id;
        setItems((ms) => ms.map((m) => (m.id === id ? { ...m, resultsSentAt: new Date().toISOString() } : m)));
        setSendTarget(null);
      }
    } finally {
      setSending(false);
    }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }
  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const target = over.id as ColumnKey;
    if (!MANAGER_SETTABLE_STATUSES.includes(target as MeetingStatus)) return;
    changeStatus(active.id as string, target as MeetingStatus);
  }

  const activeMember = activeId ? items.find((m) => m.id === activeId) : null;

  const dueDates = useMemo(() => (cycle ? getCycleDueDates(cycle) : null), [cycle]);
  const now = useMemo(() => Date.now(), []);
  const columnDue: Partial<Record<ColumnKey, Date>> = dueDates
    ? {
        NOT_READY: dueDates.readyToMeet,
        READY_TO_MEET: dueDates.meetingComplete,
        MEETING_SCHEDULED: dueDates.meetingComplete,
        MEETING_COMPLETE: dueDates.resultsSent,
      }
    : {};

  return (
    <div className="space-y-3">
      {dueDates && <CycleTimeline due={dueDates} />}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <MultiSelect label="Titles" options={titleOptions} selected={selectedTitles} onChange={setSelectedTitles} />
        <MultiSelect label="Tenure" options={[...TENURE_BUCKETS]} selected={selectedTenures} onChange={setSelectedTenures} />
      </div>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {COLUMNS.map(({ key, label }) => (
            <Column
              key={key}
              column={key}
              label={label}
              members={byColumn[key]}
              due={dueDates}
              now={now}
              dueDate={columnDue[key] ?? null}
              onOpenProfile={(id) => router.push(`/team/${id}`)}
              onSendResults={(m) => setSendTarget(m)}
            />
          ))}
        </div>
        <DragOverlay>
          {activeMember ? (
            <div className="rounded-lg border border-visory bg-white p-3 shadow-lg w-[210px]">
              <CardBody member={activeMember} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {sendTarget && (
        <SendResultsModal
          memberName={sendTarget.name}
          busy={sending}
          onConfirm={confirmSendResults}
          onCancel={() => setSendTarget(null)}
        />
      )}
    </div>
  );
}
