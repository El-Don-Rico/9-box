"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MeetingEditor } from "@/components/meetings/meeting-editor";
import { PageHeader } from "@/components/ui/page-header";
import { formatCyclePeriod } from "@/lib/utils";

interface AssessmentData {
  id: string;
  employee: { id: string; name: string; email: string };
  manager: { id: string; name: string };
  cycle: { id: string; month: number; year: number };
  meetingStatus: string;
}

export default function MeetingPage({ params }: { params: Promise<{ assessmentId: string }> }) {
  const { assessmentId } = use(params);
  const router = useRouter();
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/assessments/manager/${assessmentId}`)
      .then(async (r) => {
        if (!r.ok) {
          const d = await r.json().catch(() => ({}));
          throw new Error(d.error || "Unable to load this meeting");
        }
        return r.json();
      })
      .then((d: AssessmentData) => {
        setAssessment(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [assessmentId]);

  if (loading) return <div className="text-center py-12 text-ink-3">Loading…</div>;
  if (error || !assessment) return <div className="text-center py-12 text-magenta">{error || "Not found"}</div>;

  const assigneeOptions = [
    { id: assessment.employee.id, name: assessment.employee.name },
    { id: assessment.manager.id, name: assessment.manager.name },
  ].filter((o, i, arr) => arr.findIndex((x) => x.id === o.id) === i);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        eyebrow="1:1 meeting"
        title={<>Meeting with <em>{assessment.employee.name}.</em></>}
        sub={<span className="mono tnum">{formatCyclePeriod(assessment.cycle)}</span>}
        actions={
          <Button variant="ghost" size="sm" onClick={() => router.push(`/team/${assessment.employee.id}`)}>
            View Profile
          </Button>
        }
      />

      <MeetingEditor
        assessmentId={assessment.id}
        employeeId={assessment.employee.id}
        assigneeOptions={assigneeOptions}
      />
    </div>
  );
}
