"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { StepForm, RatingStep, TextStep, type StepConfig } from "@/components/assessments/step-form";
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
  const [oneOnOneComplete, setOneOnOneComplete] = useState(false);
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
          setOneOnOneComplete(a.oneOnOneComplete);
          setEmployeeName(a.employee?.name || "");
          setValues({
            performance: a.performance,
            performanceEvidence: a.performanceEvidence || "",
            potential: a.potential,
            potentialEvidence: a.potentialEvidence || "",
            valCustomerFirst: a.valCustomerFirst,
            valStepIntoArena: a.valStepIntoArena,
            valFlockToProblems: a.valFlockToProblems,
            valGiveEnergy: a.valGiveEnergy,
            valuesEvidence: a.valuesEvidence || "",
            engagement: a.engagement,
            engagementEvidence: a.engagementEvidence || "",
            trend: a.trend,
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
      if (submit) setIsSubmitted(true);
    } finally {
      setSaving(false);
      setSubmitting(false);
    }
  }, [cycleId, employeeId, values]);

  const markOneOnOneComplete = async () => {
    if (!assessmentId) return;
    await fetch(`/api/assessments/manager/${assessmentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oneOnOneComplete: true }),
    });
    setOneOnOneComplete(true);
  };

  const trendOptions = [
    { value: "IMPROVING", label: "Improving" },
    { value: "STABLE", label: "Stable" },
    { value: "DECLINING", label: "Declining" },
  ];

  const steps: StepConfig[] = [
    {
      id: "performance",
      title: `Performance Rating${employeeName ? ` for ${employeeName}` : ""}`,
      description: "Rate this employee's performance against objectives.",
      render: (val, onChange) => <RatingStep value={val as number | null} onChange={onChange as (v: number) => void} />,
    },
    {
      id: "performanceEvidence",
      title: "Performance Evidence",
      description: "What evidence supports this rating?",
      render: (val, onChange) => <TextStep value={val as string} onChange={onChange as (v: string) => void} placeholder="Describe specific examples of performance..." />,
    },
    {
      id: "potential",
      title: "Potential Rating",
      description: "Rate this employee's potential for growth and advancement.",
      render: (val, onChange) => <RatingStep value={val as number | null} onChange={onChange as (v: number) => void} />,
    },
    {
      id: "potentialEvidence",
      title: "Potential Evidence",
      description: "What evidence supports this potential rating?",
      render: (val, onChange) => <TextStep value={val as string} onChange={onChange as (v: string) => void} placeholder="Describe growth indicators, learning agility..." />,
    },
    {
      id: "valCustomerFirst",
      title: "Customer First",
      description: "How well does this employee embody 'Customer First'?",
      render: (val, onChange) => <RatingStep value={val as number | null} onChange={onChange as (v: number) => void} />,
    },
    {
      id: "valStepIntoArena",
      title: "Step Into the Arena",
      description: "How well does this employee take initiative and show courage?",
      render: (val, onChange) => <RatingStep value={val as number | null} onChange={onChange as (v: number) => void} />,
    },
    {
      id: "valFlockToProblems",
      title: "Flock to Problems",
      description: "How well does this employee seek out and address challenges?",
      render: (val, onChange) => <RatingStep value={val as number | null} onChange={onChange as (v: number) => void} />,
    },
    {
      id: "valGiveEnergy",
      title: "Give Energy",
      description: "How well does this employee energise and uplift the team?",
      render: (val, onChange) => <RatingStep value={val as number | null} onChange={onChange as (v: number) => void} />,
    },
    {
      id: "valuesEvidence",
      title: "Values Evidence",
      description: "Provide examples of values-aligned behaviour.",
      render: (val, onChange) => <TextStep value={val as string} onChange={onChange as (v: string) => void} placeholder="Specific examples..." />,
    },
    {
      id: "engagement",
      title: "Engagement Rating",
      description: "How engaged does this employee appear?",
      render: (val, onChange) => <RatingStep value={val as number | null} onChange={onChange as (v: number) => void} />,
    },
    {
      id: "engagementEvidence",
      title: "Engagement Evidence",
      description: "What observations support this engagement rating?",
      render: (val, onChange) => <TextStep value={val as string} onChange={onChange as (v: string) => void} placeholder="Observable behaviours..." />,
    },
    {
      id: "trend",
      title: "Trend",
      description: "Compared to last month, what direction is this employee trending?",
      render: (val, onChange) => (
        <div className="flex flex-col sm:flex-row gap-3">
          {trendOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => (onChange as (v: string) => void)(opt.value)}
              className={`flex-1 p-4 rounded-lg border-2 text-center transition-all ${
                val === opt.value
                  ? "border-visory bg-visory-light text-visory-dark font-semibold"
                  : "border-gray-200 hover:border-gray-300 text-gray-700"
              }`}
            >
              <span className="text-lg block">
                {opt.value === "IMPROVING" ? "↑" : opt.value === "STABLE" ? "→" : "↓"}
              </span>
              <span className="text-sm">{opt.label}</span>
            </button>
          ))}
        </div>
      ),
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
      <div className="text-center py-12 text-gray-500">
        No cycle selected. Go to your dashboard to start assessments.
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manager Assessment</h1>
          {employeeName && <p className="text-sm text-gray-600 mt-1">Assessing: {employeeName}</p>}
        </div>
        {isSubmitted && !oneOnOneComplete && (
          <Button onClick={markOneOnOneComplete}>
            Mark 1:1 Complete
          </Button>
        )}
        {oneOnOneComplete && (
          <span className="text-sm text-green-700 font-medium bg-green-50 px-3 py-1 rounded-lg">
            1:1 Completed
          </span>
        )}
      </div>
      <StepForm
        steps={steps}
        values={values}
        onChange={(key, val) => setValues((v) => ({ ...v, [key]: val }))}
        onSave={() => save(false)}
        onSubmit={() => save(true)}
        saving={saving}
        submitting={submitting}
        isSubmitted={isSubmitted}
      />
    </div>
  );
}
