export type RatingLevel = "LOW" | "MEDIUM" | "HIGH";

export interface EmployeeFormData {
  name: string;
  role: string;
  department: string;
}

export interface AssessmentFormData {
  performance: RatingLevel | null;
  potential: RatingLevel | null;
  engagement: RatingLevel | null;
  performanceComment: string;
  potentialComment: string;
  engagementComment: string;
  notes: string;
}

export interface EmployeeWithAssessment {
  id: string;
  name: string;
  role: string;
  department: string;
  managerId: string;
  createdAt: string;
  updatedAt: string;
  assessments: AssessmentData[];
}

export interface AssessmentData {
  id: string;
  employeeId: string;
  period: string;
  performance: RatingLevel;
  potential: RatingLevel;
  engagement: RatingLevel;
  performanceComment: string | null;
  potentialComment: string | null;
  engagementComment: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BatchAssessmentPayload {
  period: string;
  assessments: Array<{
    employeeId: string;
    performance: RatingLevel;
    potential: RatingLevel;
    engagement: RatingLevel;
    performanceComment?: string;
    potentialComment?: string;
    engagementComment?: string;
    notes?: string;
  }>;
}
