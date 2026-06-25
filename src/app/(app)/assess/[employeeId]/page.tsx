"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { StepForm, RatingStep, TextStep, MultiRatingStep, type StepConfig } from "@/components/assessments/step-form";
import { assessmentPrompts } from "@/lib/assessment-prompts";
import { GoalsPanel } from "@/components/assessments/goals-panel";
import { ActionsEditor } from "@/components/meetings/actions-editor";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

export default function ManagerAssessPage({ params }: { params: Promise<{ employeeId: string }> }) {
  const { employeeId } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const cycleId = searchParams.get("cycleId");
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resultsSent, setResultsSent] = useState(false);
  const [editing, setEditing] = useState(false);
  const [employeeName, setEmployeeName] = useState("");

  useEffect(() => {
    if (!cycleId) return;
    fetch(`/api/assessments/manager?cycleId=${cycleId}&employeeId=${employeeId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.length > 0) {
          const a = data[0];
          setAssessmentId(a.id);
          setIsSubmitted(!!a.submittedAt);
          setResultsSent(!!a.resultsSentAt);
          setEmployeeName(a.employee?.name || "");
          setValues({
            performance: a.performance,
            performanceEvidence: a.performanceEvidence || "",
            growthReadiness: a.growthReadiness,
            growthReadinessEvidence: a.growthReadinessEvidence || "",
            valCustomerFirst: a.valCustomerFirst,
            valStepIntoArena: a.valStepIntoArena,
            valFlockToProblems: a.valFlockToProblems,
            valGiveEnergy: a.valGiveEnergy,
            valuesEvidence: a.valuesEvidence || "",
            engagement: a.engagement,
            engagementEvidence: a.engagementEvidence || "",
            notes: a.notes || "",
          });
        }
      });
  }, [cycleId, employeeId]);

  const save = useCallback(async (submit = false) => {
    if (!cycleId) return;
    const body = { cycleId, employeeId, ...values };
    if (submit) {
      (body as Record<string, unknown>).submittedAt = new Date().toISOString();
    }

    if (submit) setSubmitting(true);
    else setSaving(true);

    try {
      const res = await fetch("/api/assessments/manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setAssessmentId(data.id);
      if (submit) {
        setIsSubmitted(true);
        setEditing(false);
        // Always return to the dashboard after submitting.
        router.push("/dashboard");
      }
    } finally {
      setSaving(false);
      setSubmitting(false);
    }
  }, [cycleId, employeeId, values]);

  const steps: StepConfig[] = [
    {
      id: "performance",
      title: `Performance Rating${employeeName ? ` for ${employeeName}` : ""}`,
      description: "Rate this employee's performance against objectives.",
      render: (val, onChange) => <RatingStep value={val as number | null} onChange={onChange as (v: number) => void} prompts={assessmentPrompts.performance?.manager} />,
      footer: (
        <>
          <GoalsPanel
            employeeId={employeeId}
            cycleId={cycleId}
            editable={!resultsSent && !(isSubmitted && !editing)}
            section="metrics"
            requireNote
          />
          <ActionsEditor
            employeeId={employeeId}
            readOnly
            assigneeOptions={[{ id: employeeId, name: employeeName || "Employee" }]}
          />
        </>
      ),
    },
    {
      id: "performanceEvidence",
      title: "Performance Evidence",
      description: "What evidence supports this rating?",
      render: (val, onChange) => <TextStep value={val as string} onChange={onChange as (v: string) => void} placeholder="Describe specific examples of performance..." />,
    },
    {
      id: "growthReadiness",
      title: "Growth Readiness Rating",
      description: "Rate this employee's readiness for growth and advancement.",
      render: (val, onChange) => <RatingStep value={val as number | null} onChange={onChange as (v: number) => void} labels={{ 1: "Developing", 2: "Building", 3: "Ready Now" }} prompts={assessmentPrompts.growthReadiness?.manager} />,
    },
    {
      id: "growthReadinessEvidence",
      title: "Growth Readiness Evidence",
      description: "What evidence supports this growth readiness rating?",
      render: (val, onChange) => <TextStep value={val as string} onChange={onChange as (v: string) => void} placeholder="Describe growth indicators, learning agility..." />,
    },
    {
      id: "values",
      title: "Values Alignment",
      description: "Rate this employee against each value, then add overall comments for the section.",
      renderMulti: (vals, onChange) => (
        <MultiRatingStep
          values={vals}
          onChange={onChange}
          commentId="valuesEvidence"
          commentLabel="Values Evidence"
          commentPlaceholder="Examples of values-aligned behaviour..."
          items={[
            { id: "valCustomerFirst", label: "Customer First", prompts: assessmentPrompts.valCustomerFirst?.manager },
            { id: "valStepIntoArena", label: "Step Into the Arena", prompts: assessmentPrompts.valStepIntoArena?.manager },
            { id: "valFlockToProblems", label: "Flock to Problems", prompts: assessmentPrompts.valFlockToProblems?.manager },
            { id: "valGiveEnergy", label: "Give Energy", prompts: assessmentPrompts.valGiveEnergy?.manager },
          ]}
        />
      ),
    },
    {
      id: "engagement",
      title: "Engagement Rating",
      description: "How engaged does this employee appear?",
      render: (val, onChange) => <RatingStep value={val as number | null} onChange={onChange as (v: number) => void} prompts={assessmentPrompts.engagement?.manager} />,
    },
    {
      id: "engagementEvidence",
      title: "Engagement Evidence",
      description: "What observations support this engagement rating?",
      render: (val, onChange) => <TextStep value={val as string} onChange={onChange as (v: string) => void} placeholder="Observable behaviours..." />,
    },
    {
      id: "notes",
      title: "Additional Notes",
      description: "Any other observations or feedback for this employee.",
      render: (val, onChange) => <TextStep value={val as string} onChange={onChange as (v: string) => void} placeholder="Additional context, action items..." />,
    },
  ];

  if (!cycleId) {
    return (
      <div className="text-center py-12 text-ink-3">
        No cycle selected. Go to your dashboard to start assessments.
      </div>
    );
  }

  return (
    <div className="py-4">
      <PageHeader
        eyebrow="Manager assessment"
        title={<>Assess <em>{employeeName || "report"}.</em></>}
        sub={employeeName ? `Rate ${employeeName} across performance, growth, values and engagement.` : undefined}
      />
      <GoalsPanel
        employeeId={employeeId}
        cycleId={cycleId}
        editable={!resultsSent && !(isSubmitted && !editing)}
        section="goals"
      />

      {resultsSent ? (
        <div className="max-w-2xl mx-auto mb-6 rounded-lg bg-paper-2 border border-line p-4 text-sm text-ink-2">
          Results have been sent to the employee. This assessment is locked and can no longer be edited.
        </div>
      ) : isSubmitted && !editing ? (
        <div className="max-w-2xl mx-auto mb-6 flex items-center justify-between gap-3 rounded-lg bg-paper-2 border border-amber/40 p-4">
          <p className="text-sm text-ink-2">
            This assessment has been submitted. You can edit it until results are sent — changes are recorded in the audit log.
          </p>
          <Button size="sm" variant="magenta" className="shrink-0" onClick={() => setEditing(true)}>
            Edit assessment
          </Button>
        </div>
      ) : null}

      <StepForm
        steps={steps}
        values={values}
        onChange={(key, val) => setValues((v) => ({ ...v, [key]: val }))}
        onSave={() => save(false)}
        onSubmit={() => save(true)}
        saving={saving}
        submitting={submitting}
        isSubmitted={resultsSent || (isSubmitted && !editing)}
      />
    </div>
  );
}
