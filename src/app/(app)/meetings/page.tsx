"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import { MeetingPanel } from "@/components/meetings/meeting-panel";
import { formatCyclePeriod } from "@/lib/utils";
import {
  MEETING_COLUMNS,
  MEETING_STATUS_LABELS,
  MANAGER_SETTABLE_STATUSES,
  meetingStatusColor,
} from "@/lib/meeting";
import { getTenureBucket, getTenureMonths, TENURE_BUCKETS } from "@/lib/tenure";
import type { CycleData, TeamMemberStatus, MeetingStatus } from "@/types";

function tenureLabel(startDate: string | null | undefined): string {
  const months = getTenureMonths(startDate);
  if (months === null) return "No start date";
  return `${months} mo`;
}

function MemberCard({
  member,
  draggable,
  onChangeStatus,
  onStartMeeting,
  onOpenProfile,
}: {
  member: TeamMemberStatus;
  draggable: boolean;
  onChangeStatus: (id: string, status: MeetingStatus) => void;
  onStartMeeting: (member: TeamMemberStatus) => void;
  onOpenProfile: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: member.id,
    disabled: !draggable,
  });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border border-gray-200 bg-white p-3 shadow-sm ${isDragging ? "opacity-40" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={draggable ? "cursor-grab active:cursor-grabbing" : ""} {...attributes} {...listeners}>
          <p className="text-sm font-medium text-visory-navy">{member.name}</p>
          {member.jobTitle && <p className="text-xs text-gray-500">{member.jobTitle}</p>}
          <Badge className="bg-gray-100 text-gray-600 border-gray-300 text-xs mt-1">
            {tenureLabel(member.startDate)}
          </Badge>
        </div>
        <button
          onClick={() => onOpenProfile(member.id)}
          className="text-xs text-visory hover:text-visory-dark font-medium shrink-0"
        >
          Profile
        </button>
      </div>

      {draggable && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => onStartMeeting(member)}>Start Meeting</Button>
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
  ...cardProps
}: {
  status: MeetingStatus;
  members: TeamMemberStatus[];
  onChangeStatus: (id: string, status: MeetingStatus) => void;
  onStartMeeting: (member: TeamMemberStatus) => void;
  onOpenProfile: (id: string) => void;
}) {
  const settable = MANAGER_SETTABLE_STATUSES.includes(status);
  const { setNodeRef, isOver } = useDroppable({ id: status, disabled: !settable });

  return (
    <div className="flex-1 min-w-[220px]">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-sm font-semibold text-visory-navy">{MEETING_STATUS_LABELS[status]}</span>
        <Badge className={meetingStatusColor(status)}>{members.length}</Badge>
      </div>
      <div
        ref={setNodeRef}
        className={`rounded-lg p-2 space-y-2 min-h-[120px] transition-colors ${
          isOver && settable ? "bg-visory-light/60 ring-2 ring-visory" : "bg-gray-50"
        }`}
      >
        {members.map((m) => (
          <MemberCard key={m.id} member={m} draggable={settable} {...cardProps} />
        ))}
        {members.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">None</p>
        )}
      </div>
    </div>
  );
}

export default function MeetingsKanbanPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const role = session?.user?.role;

  const [cycle, setCycle] = useState<CycleData | null>(null);
  const [members, setMembers] = useState<TeamMemberStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTitles, setSelectedTitles] = useState<string[]>([]);
  const [selectedTenures, setSelectedTenures] = useState<string[]>([]);
  const [activeMeeting, setActiveMeeting] = useState<TeamMemberStatus | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    fetch("/api/cycles")
      .then((r) => r.json())
      .then((cycles: CycleData[]) => {
        const current = cycles.find((c) => c.status === "OPEN") || cycles[0];
        if (!current) {
          setLoading(false);
          return;
        }
        setCycle(current);
        return fetch(`/api/team?cycleId=${current.id}`)
          .then((r) => r.json())
          .then((team: TeamMemberStatus[]) => {
            setMembers(Array.isArray(team) ? team : []);
            setLoading(false);
          });
      })
      .catch(() => setLoading(false));
  }, []);

  const titleOptions = useMemo(
    () => [...new Set(members.map((m) => m.jobTitle).filter(Boolean) as string[])].sort(),
    [members]
  );

  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (selectedTitles.length > 0 && (!m.jobTitle || !selectedTitles.includes(m.jobTitle))) return false;
      if (selectedTenures.length > 0) {
        const bucket = getTenureBucket(m.startDate);
        if (!bucket || !selectedTenures.includes(bucket)) return false;
      }
      return true;
    });
  }, [members, selectedTitles, selectedTenures]);

  const byStatus = useMemo(() => {
    const map: Record<MeetingStatus, TeamMemberStatus[]> = {
      NOT_READY: [],
      READY_TO_MEET: [],
      MEETING_SCHEDULED: [],
      MEETING_COMPLETE: [],
    };
    for (const m of filtered) {
      map[m.meetingStatus ?? "NOT_READY"].push(m);
    }
    return map;
  }, [filtered]);

  async function changeStatus(employeeId: string, status: MeetingStatus) {
    const member = members.find((m) => m.id === employeeId);
    if (!member?.managerAssessmentId || member.meetingStatus === status) return;
    const prev = member.meetingStatus;
    setMembers((ms) => ms.map((m) => (m.id === employeeId ? { ...m, meetingStatus: status } : m)));
    const res = await fetch("/api/meetings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessmentId: member.managerAssessmentId, meetingStatus: status }),
    });
    if (!res.ok) {
      // revert on failure
      setMembers((ms) => ms.map((m) => (m.id === employeeId ? { ...m, meetingStatus: prev } : m)));
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const target = over.id as MeetingStatus;
    if (!MANAGER_SETTABLE_STATUSES.includes(target)) return;
    changeStatus(active.id as string, target);
  }

  function startMeeting(member: TeamMemberStatus) {
    setActiveMeeting(member);
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Loading…</div>;

  if (!role || role === "EMPLOYEE") {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-visory-navy mb-2">Meetings</h1>
        <p className="text-gray-500">You don&apos;t have team members assigned to you.</p>
      </div>
    );
  }

  const assigneeOptions = activeMeeting
    ? [
        { id: activeMeeting.id, name: activeMeeting.name },
        ...(session?.user?.id && session.user.name
          ? [{ id: session.user.id, name: session.user.name }]
          : []),
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-visory-navy">Meetings</h1>
          {cycle && (
            <p className="text-sm text-gray-600 mt-1">
              {formatCyclePeriod(cycle.month, cycle.year)} · drag a card or use the dropdown to update status
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MultiSelect label="Titles" options={titleOptions} selected={selectedTitles} onChange={setSelectedTitles} />
          <MultiSelect label="Tenure" options={[...TENURE_BUCKETS]} selected={selectedTenures} onChange={setSelectedTenures} />
        </div>
      </div>

      {!cycle ? (
        <Card>
          <CardContent>
            <p className="text-sm text-gray-500 py-4 text-center">No assessment cycles found.</p>
          </CardContent>
        </Card>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {MEETING_COLUMNS.map((status) => (
              <Column
                key={status}
                status={status}
                members={byStatus[status]}
                onChangeStatus={changeStatus}
                onStartMeeting={startMeeting}
                onOpenProfile={(id) => router.push(`/team/${id}`)}
              />
            ))}
          </div>
        </DndContext>
      )}

      {activeMeeting?.managerAssessmentId && (
        <MeetingPanel
          assessmentId={activeMeeting.managerAssessmentId}
          employeeId={activeMeeting.id}
          employeeName={activeMeeting.name}
          assigneeOptions={assigneeOptions}
          onClose={() => setActiveMeeting(null)}
          onCompleted={() => changeStatus(activeMeeting.id, "MEETING_COMPLETE")}
        />
      )}
    </div>
  );
}
