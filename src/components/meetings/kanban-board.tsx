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
  MEETING_COLUMNS,
  MEETING_STATUS_LABELS,
  MANAGER_SETTABLE_STATUSES,
  meetingStatusColor,
} from "@/lib/meeting";
import { getTenureBucket, getTenureMonths, TENURE_BUCKETS } from "@/lib/tenure";
import type { TeamMemberStatus, MeetingStatus } from "@/types";

function tenureLabel(startDate: string | null | undefined): string {
  const months = getTenureMonths(startDate);
  if (months === null) return "No start date";
  return `${months} mo`;
}

function openMeeting(assessmentId: string) {
  // Open the meeting in its own window/tab rather than a modal.
  window.open(`/meeting/${assessmentId}`, "_blank", "noopener");
}

function CardInner({
  member,
  draggable,
  onChangeStatus,
  onOpenProfile,
}: {
  member: TeamMemberStatus;
  draggable: boolean;
  onChangeStatus?: (id: string, status: MeetingStatus) => void;
  onOpenProfile?: (id: string) => void;
}) {
  const isScheduled = member.meetingStatus === "MEETING_SCHEDULED";
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-visory-navy">{member.name}</p>
          {member.jobTitle && <p className="text-xs text-gray-500">{member.jobTitle}</p>}
          <Badge className="bg-gray-100 text-gray-600 border-gray-300 text-xs mt-1">
            {tenureLabel(member.startDate)}
          </Badge>
        </div>
      </div>

      {draggable && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {onOpenProfile && (
            <Button size="sm" variant="secondary" onClick={() => onOpenProfile(member.id)}>
              Profile
            </Button>
          )}
          {isScheduled && member.managerAssessmentId && (
            <Button size="sm" onClick={() => openMeeting(member.managerAssessmentId!)}>
              {member.meetingStarted ? "Edit Meeting Notes" : "Start Meeting"}
            </Button>
          )}
          {onChangeStatus && (
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
    </>
  );
}

function DraggableCard({
  member,
  draggable,
  onChangeStatus,
  onOpenProfile,
}: {
  member: TeamMemberStatus;
  draggable: boolean;
  onChangeStatus: (id: string, status: MeetingStatus) => void;
  onOpenProfile: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: member.id,
    disabled: !draggable,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
      }}
      className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
    >
      {/* Drag handle: the member identity area */}
      <div
        {...(draggable ? { ...attributes, ...listeners } : {})}
        className={draggable ? "cursor-grab active:cursor-grabbing touch-none" : ""}
      >
        <p className="text-sm font-medium text-visory-navy">{member.name}</p>
        {member.jobTitle && <p className="text-xs text-gray-500">{member.jobTitle}</p>}
        <Badge className="bg-gray-100 text-gray-600 border-gray-300 text-xs mt-1">
          {tenureLabel(member.startDate)}
        </Badge>
      </div>

      {draggable && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => onOpenProfile(member.id)}>
            Profile
          </Button>
          {member.meetingStatus === "MEETING_SCHEDULED" && member.managerAssessmentId && (
            <Button size="sm" onClick={() => openMeeting(member.managerAssessmentId!)}>
              {member.meetingStarted ? "Edit Meeting Notes" : "Start Meeting"}
            </Button>
          )}
          <select
            value={member.meetingStatus}
            onChange={(e) => onChangeStatus(member.id, e.target.value as MeetingStatus)}
            className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-visory"
          >
            {MANAGER_SETTABLE_STATUSES.map((s) => (
              <option key={s} value={s}>{MEETING_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

function Column({
  status,
  members,
  onChangeStatus,
  onOpenProfile,
}: {
  status: MeetingStatus;
  members: TeamMemberStatus[];
  onChangeStatus: (id: string, status: MeetingStatus) => void;
  onOpenProfile: (id: string) => void;
}) {
  const settable = MANAGER_SETTABLE_STATUSES.includes(status);
  const { setNodeRef, isOver } = useDroppable({ id: status, disabled: !settable });

  return (
    <div className="flex-1 min-w-[230px]">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-sm font-semibold text-visory-navy">{MEETING_STATUS_LABELS[status]}</span>
        <Badge className={meetingStatusColor(status)}>{members.length}</Badge>
      </div>
      <div
        ref={setNodeRef}
        className={`rounded-lg p-2 space-y-2 min-h-[140px] transition-colors ${
          isOver && settable ? "bg-visory-light/60 ring-2 ring-visory" : "bg-gray-50"
        }`}
      >
        {members.map((m) => (
          <DraggableCard
            key={m.id}
            member={m}
            draggable={settable}
            onChangeStatus={onChangeStatus}
            onOpenProfile={onOpenProfile}
          />
        ))}
        {members.length === 0 && <p className="text-xs text-gray-400 text-center py-4">None</p>}
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

  const byStatus = useMemo(() => {
    const map: Record<MeetingStatus, TeamMemberStatus[]> = {
      NOT_READY: [],
      READY_TO_MEET: [],
      MEETING_SCHEDULED: [],
      MEETING_COMPLETE: [],
    };
    for (const m of filtered) map[m.meetingStatus ?? "NOT_READY"].push(m);
    return map;
  }, [filtered]);

  async function changeStatus(employeeId: string, status: MeetingStatus) {
    const member = items.find((m) => m.id === employeeId);
    if (!member?.managerAssessmentId || member.meetingStatus === status) return;
    const prev = member.meetingStatus;
    setItems((ms) => ms.map((m) => (m.id === employeeId ? { ...m, meetingStatus: status } : m)));
    const res = await fetch("/api/meetings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessmentId: member.managerAssessmentId, meetingStatus: status }),
    });
    if (!res.ok) {
      setItems((ms) => ms.map((m) => (m.id === employeeId ? { ...m, meetingStatus: prev } : m)));
    }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const target = over.id as MeetingStatus;
    if (!MANAGER_SETTABLE_STATUSES.includes(target)) return;
    changeStatus(active.id as string, target);
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
          {MEETING_COLUMNS.map((status) => (
            <Column
              key={status}
              status={status}
              members={byStatus[status]}
              onChangeStatus={changeStatus}
              onOpenProfile={(id) => router.push(`/team/${id}`)}
            />
          ))}
        </div>
        <DragOverlay>
          {activeMember ? (
            <div className="rounded-lg border border-visory bg-white p-3 shadow-lg w-[210px]">
              <CardInner member={activeMember} draggable={false} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
