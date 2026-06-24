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
import { MEETING_STATUS_LABELS, MANAGER_SETTABLE_STATUSES, meetingStatusColor } from "@/lib/meeting";
import { getTenureBucket, getTenureMonths, TENURE_BUCKETS } from "@/lib/tenure";
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

function tenureLabel(startDate: string | null | undefined): string {
  const months = getTenureMonths(startDate);
  if (months === null) return "No start date";
  return `${months} mo`;
}

function openMeeting(assessmentId: string) {
  window.open(`/meeting/${assessmentId}`, "_blank", "noopener");
}

function CardBody({ member }: { member: TeamMemberStatus }) {
  return (
    <>
      <p className="text-sm font-medium text-visory-navy">{member.name}</p>
      {member.jobTitle && <p className="text-xs text-gray-500">{member.jobTitle}</p>}
      <Badge className="bg-gray-100 text-gray-600 border-gray-300 text-xs mt-1">
        {tenureLabel(member.startDate)}
      </Badge>
    </>
  );
}

function MemberCard({
  member,
  column,
  onChangeStatus,
  onOpenProfile,
  onSendResults,
}: {
  member: TeamMemberStatus;
  column: ColumnKey;
  onChangeStatus: (id: string, status: MeetingStatus) => void;
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

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }}
      className={`rounded-lg border p-3 shadow-sm ${closed ? "border-gray-200 bg-gray-50 opacity-70" : "border-gray-200 bg-white"}`}
    >
      <div
        {...(draggable ? { ...attributes, ...listeners } : {})}
        className={draggable ? "cursor-grab active:cursor-grabbing touch-none" : ""}
      >
        <CardBody member={member} />
      </div>

      {closed ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">Closed · Results Sent</Badge>
          <Button size="sm" variant="secondary" onClick={() => onOpenProfile(member.id)}>Profile</Button>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => onOpenProfile(member.id)}>Profile</Button>
          {column === "MEETING_SCHEDULED" && member.managerAssessmentId && (
            <Button size="sm" onClick={() => openMeeting(member.managerAssessmentId!)}>
              {member.meetingStarted ? "Edit Meeting Notes" : "Start Meeting"}
            </Button>
          )}
          {column === "MEETING_COMPLETE" && member.managerAssessmentId && (
            <Button size="sm" onClick={() => onSendResults(member)}>Send Results</Button>
          )}
          {settable && (
            <select
              value={member.meetingStatus}
              onChange={(e) => onChangeStatus(member.id, e.target.value as MeetingStatus)}
              className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-visory"
            >
              {MANAGER_SETTABLE_STATUSES.map((s) => (
                <option key={s} value={s}>{MEETING_STATUS_LABELS[s]}</option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  );
}

function Column({
  column,
  label,
  members,
  onChangeStatus,
  onOpenProfile,
  onSendResults,
}: {
  column: ColumnKey;
  label: string;
  members: TeamMemberStatus[];
  onChangeStatus: (id: string, status: MeetingStatus) => void;
  onOpenProfile: (id: string) => void;
  onSendResults: (member: TeamMemberStatus) => void;
}) {
  // Only the three meeting statuses accept drops; NOT_READY and the terminal
  // REVIEW_COMPLETE column do not.
  const droppable = MANAGER_SETTABLE_STATUSES.includes(column as MeetingStatus);
  const { setNodeRef, isOver } = useDroppable({ id: column, disabled: !droppable });

  return (
    <div className="flex-1 min-w-[230px]">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-sm font-semibold text-visory-navy">{label}</span>
        <Badge className={columnColor(column)}>{members.length}</Badge>
      </div>
      <div
        ref={setNodeRef}
        className={`rounded-lg p-2 space-y-2 min-h-[140px] transition-colors ${
          isOver && droppable ? "bg-visory-light/60 ring-2 ring-visory" : "bg-gray-50"
        }`}
      >
        {members.map((m) => (
          <MemberCard
            key={m.id}
            member={m}
            column={column}
            onChangeStatus={onChangeStatus}
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

export function KanbanBoard({ members }: { members: TeamMemberStatus[] }) {
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

  return (
    <div className="space-y-3">
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
              onChangeStatus={changeStatus}
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
