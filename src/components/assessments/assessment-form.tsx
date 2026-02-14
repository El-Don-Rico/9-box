"use client";

import { RatingSelector } from "./rating-selector";
import type { AssessmentFormData, RatingLevel } from "@/types";

interface AssessmentFormProps {
  employeeName: string;
  data: AssessmentFormData;
  onChange: (data: AssessmentFormData) => void;
}

export function AssessmentForm({
  employeeName,
  data,
  onChange,
}: AssessmentFormProps) {
  function updateField<K extends keyof AssessmentFormData>(
    field: K,
    value: AssessmentFormData[K]
  ) {
    onChange({ ...data, [field]: value });
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900">{employeeName}</h3>
      </div>

      <RatingSelector
        label="Performance"
        value={data.performance}
        onChange={(v: RatingLevel) => updateField("performance", v)}
        comment={data.performanceComment}
        onCommentChange={(c: string) => updateField("performanceComment", c)}
      />

      <RatingSelector
        label="Potential"
        value={data.potential}
        onChange={(v: RatingLevel) => updateField("potential", v)}
        comment={data.potentialComment}
        onCommentChange={(c: string) => updateField("potentialComment", c)}
      />

      <RatingSelector
        label="Engagement"
        value={data.engagement}
        onChange={(v: RatingLevel) => updateField("engagement", v)}
        comment={data.engagementComment}
        onCommentChange={(c: string) => updateField("engagementComment", c)}
      />
    </div>
  );
}
