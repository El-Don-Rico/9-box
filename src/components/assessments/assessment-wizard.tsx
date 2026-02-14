"use client";

import { useReducer, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AssessmentForm } from "./assessment-form";
import { getCurrentPeriod, formatPeriod, getRatingColor, getRatingLabel } from "@/lib/utils";
import type { AssessmentFormData, EmployeeWithAssessment, RatingLevel } from "@/types";

interface WizardState {
  period: string;
  currentStep: number;
  selectedEmployees: EmployeeWithAssessment[];
  assessments: Record<string, AssessmentFormData>;
  generalNotes: Record<string, string>;
  isSubmitting: boolean;
}

type WizardAction =
  | { type: "SET_PERIOD"; period: string }
  | { type: "SELECT_EMPLOYEES"; employees: EmployeeWithAssessment[] }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "GOTO_STEP"; step: number }
  | { type: "UPDATE_ASSESSMENT"; employeeId: string; data: AssessmentFormData }
  | { type: "UPDATE_GENERAL_NOTES"; employeeId: string; notes: string }
  | { type: "SET_SUBMITTING"; isSubmitting: boolean };

function emptyAssessment(): AssessmentFormData {
  return {
    performance: null,
    potential: null,
    engagement: null,
    performanceComment: "",
    potentialComment: "",
    engagementComment: "",
    notes: "",
  };
}

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_PERIOD":
      return { ...state, period: action.period };
    case "SELECT_EMPLOYEES": {
      const assessments = { ...state.assessments };
      const generalNotes = { ...state.generalNotes };
      action.employees.forEach((emp) => {
        if (!assessments[emp.id]) {
          assessments[emp.id] = emptyAssessment();
        }
        if (!generalNotes[emp.id]) {
          generalNotes[emp.id] = "";
        }
      });
      return { ...state, selectedEmployees: action.employees, assessments, generalNotes };
    }
    case "NEXT_STEP":
      return { ...state, currentStep: state.currentStep + 1 };
    case "PREV_STEP":
      return { ...state, currentStep: Math.max(0, state.currentStep - 1) };
    case "GOTO_STEP":
      return { ...state, currentStep: action.step };
    case "UPDATE_ASSESSMENT":
      return {
        ...state,
        assessments: { ...state.assessments, [action.employeeId]: action.data },
      };
    case "UPDATE_GENERAL_NOTES":
      return {
        ...state,
        generalNotes: { ...state.generalNotes, [action.employeeId]: action.notes },
      };
    case "SET_SUBMITTING":
      return { ...state, isSubmitting: action.isSubmitting };
    default:
      return state;
  }
}

export function AssessmentWizard() {
  const router = useRouter();
  const [employees, setEmployees] = useState<EmployeeWithAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [submitError, setSubmitError] = useState("");

  const [state, dispatch] = useReducer(wizardReducer, {
    period: getCurrentPeriod(),
    currentStep: 0,
    selectedEmployees: [],
    assessments: {},
    generalNotes: {},
    isSubmitting: false,
  });

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const res = await fetch("/api/employees");
        const data = await res.json();
        setEmployees(data);
        // Pre-select all employees
        setSelectedIds(new Set(data.map((e: EmployeeWithAssessment) => e.id)));
      } catch (err) {
        console.error("Failed to fetch employees:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchEmployees();
  }, []);

  function toggleEmployee(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function startAssessment() {
    const selected = employees.filter((e) => selectedIds.has(e.id));
    dispatch({ type: "SELECT_EMPLOYEES", employees: selected });
    dispatch({ type: "NEXT_STEP" });
  }

  function isStepComplete(employeeId: string): boolean {
    const a = state.assessments[employeeId];
    return !!a && a.performance !== null && a.potential !== null && a.engagement !== null;
  }

  async function handleSubmit() {
    setSubmitError("");
    dispatch({ type: "SET_SUBMITTING", isSubmitting: true });

    const payload = {
      period: state.period,
      assessments: state.selectedEmployees.map((emp) => {
        const a = state.assessments[emp.id];
        return {
          employeeId: emp.id,
          performance: a.performance as RatingLevel,
          potential: a.potential as RatingLevel,
          engagement: a.engagement as RatingLevel,
          performanceComment: a.performanceComment || undefined,
          potentialComment: a.potentialComment || undefined,
          engagementComment: a.engagementComment || undefined,
          notes: state.generalNotes[emp.id] || a.notes || undefined,
        };
      }),
    };

    try {
      const res = await fetch("/api/assessments/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit assessments");
    } finally {
      dispatch({ type: "SET_SUBMITTING", isSubmitting: false });
    }
  }

  const totalSteps = state.selectedEmployees.length + 2; // setup + employees + review
  const isReviewStep = state.currentStep === totalSteps - 1;
  const isSetupStep = state.currentStep === 0;
  const currentEmployeeIndex = state.currentStep - 1;
  const currentEmployee = state.selectedEmployees[currentEmployeeIndex];

  const allComplete = state.selectedEmployees.every((emp) => isStepComplete(emp.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading employees...</p>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-lg font-medium text-gray-700">No employees to assess</p>
          <p className="text-sm text-gray-500 mt-1">Add employees first before starting assessments.</p>
          <Button className="mt-4" onClick={() => router.push("/employees")}>
            Add Employees
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Step 0: Setup
  if (isSetupStep) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monthly Assessment</h1>
          <p className="text-sm text-gray-600 mt-1">
            Rate your team on performance, potential, and engagement
          </p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Assessment Period</h2>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <input
                type="month"
                value={state.period}
                onChange={(e) => dispatch({ type: "SET_PERIOD", period: e.target.value })}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">
                {formatPeriod(state.period)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Select Employees to Assess
              </h2>
              <span className="text-sm text-gray-500">
                {selectedIds.size} of {employees.length} selected
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {employees.map((emp) => {
                const hasAssessment = emp.assessments.some(
                  (a) => a.period === state.period
                );
                return (
                  <label
                    key={emp.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(emp.id)}
                      onChange={() => toggleEmployee(emp.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                      <p className="text-xs text-gray-500">
                        {emp.role} &middot; {emp.department}
                      </p>
                    </div>
                    {hasAssessment && (
                      <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                        Previously assessed
                      </Badge>
                    )}
                  </label>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={startAssessment}
          disabled={selectedIds.size === 0}
          size="lg"
        >
          Start Assessment ({selectedIds.size} employee{selectedIds.size !== 1 ? "s" : ""})
        </Button>
      </div>
    );
  }

  // Review step
  if (isReviewStep) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Review & Submit</h1>
            <p className="text-sm text-gray-600 mt-1">
              {formatPeriod(state.period)} Assessment
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Step {state.currentStep + 1} of {totalSteps}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: "100%" }}
          />
        </div>

        {submitError && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        <div className="space-y-4">
          {state.selectedEmployees.map((emp, idx) => {
            const a = state.assessments[emp.id];
            const complete = isStepComplete(emp.id);
            return (
              <Card key={emp.id} className={!complete ? "border-red-200" : ""}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{emp.name}</p>
                      <p className="text-xs text-gray-500">
                        {emp.role} &middot; {emp.department}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {complete ? (
                        <>
                          <Badge className={getRatingColor(a.performance!)}>
                            Perf: {getRatingLabel(a.performance!)}
                          </Badge>
                          <Badge className={getRatingColor(a.potential!)}>
                            Pot: {getRatingLabel(a.potential!)}
                          </Badge>
                          <Badge className={getRatingColor(a.engagement!)}>
                            Eng: {getRatingLabel(a.engagement!)}
                          </Badge>
                        </>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 border-red-300">
                          Incomplete
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dispatch({ type: "GOTO_STEP", step: idx + 1 })}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                  {/* General notes for this employee */}
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      General Notes for {emp.name}
                    </label>
                    <textarea
                      value={state.generalNotes[emp.id] || ""}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_GENERAL_NOTES",
                          employeeId: emp.id,
                          notes: e.target.value,
                        })
                      }
                      placeholder="Overall observations, development goals, action items..."
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-4">
          <Button
            variant="secondary"
            onClick={() => dispatch({ type: "PREV_STEP" })}
          >
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!allComplete || state.isSubmitting}
            size="lg"
          >
            {state.isSubmitting ? "Submitting..." : "Submit All Assessments"}
          </Button>
        </div>
      </div>
    );
  }

  // Individual assessment step
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Employee {currentEmployeeIndex + 1} of {state.selectedEmployees.length}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {formatPeriod(state.period)} Assessment
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Step {state.currentStep + 1} of {totalSteps}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{
            width: `${((state.currentStep) / (totalSteps - 1)) * 100}%`,
          }}
        />
      </div>

      {/* Employee step indicators */}
      <div className="flex gap-2 flex-wrap">
        {state.selectedEmployees.map((emp, idx) => (
          <button
            key={emp.id}
            onClick={() => dispatch({ type: "GOTO_STEP", step: idx + 1 })}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              idx === currentEmployeeIndex
                ? "bg-blue-600 text-white"
                : isStepComplete(emp.id)
                  ? "bg-green-100 text-green-800 border border-green-300"
                  : "bg-gray-100 text-gray-600 border border-gray-200"
            }`}
          >
            {emp.name.split(" ")[0]}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="py-6">
          <AssessmentForm
            employeeName={`${currentEmployee.name} — ${currentEmployee.role}, ${currentEmployee.department}`}
            data={state.assessments[currentEmployee.id]}
            onChange={(data) =>
              dispatch({
                type: "UPDATE_ASSESSMENT",
                employeeId: currentEmployee.id,
                data,
              })
            }
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={() => dispatch({ type: "PREV_STEP" })}
        >
          Back
        </Button>
        <Button
          onClick={() => dispatch({ type: "NEXT_STEP" })}
          disabled={!isStepComplete(currentEmployee.id)}
        >
          {currentEmployeeIndex === state.selectedEmployees.length - 1
            ? "Review"
            : "Next Employee"}
        </Button>
      </div>
    </div>
  );
}
