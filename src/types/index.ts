export type { Role } from "@prisma/client";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  managerId: string | null;
  isActive: boolean;
  manager?: { id: string; name: string } | null;
}

export interface CycleData {
  id: string;
  month: number;
  year: number;
  status: "OPEN" | "CLOSED";
  createdAt: string;
}

export interface ManagerAssessmentData {
  id: string;
  cycleId: string;
  managerId: string;
  employeeId: string;
  performance: number | null;
  performanceEvidence: string | null;
  growthReadiness: number | null;
  growthReadinessEvidence: string | null;
  valCustomerFirst: number | null;
  valStepIntoArena: number | null;
  valFlockToProblems: number | null;
  valGiveEnergy: number | null;
  valuesEvidence: string | null;
  engagement: number | null;
  engagementEvidence: string | null;
  notes: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: { id: string; name: string; email: string; role: string; team: string | null; jobTitle: string | null };
  manager?: { id: string; name: string };
}

export interface SelfAssessmentData {
  id: string;
  cycleId: string;
  employeeId: string;
  performance: number | null;
  performanceJustification: string | null;
  achievements: string | null;
  blockers: string | null;
  learning: string | null;
  valCustomerFirst: number | null;
  valStepIntoArena: number | null;
  valFlockToProblems: number | null;
  valGiveEnergy: number | null;
  valuesReflection: string | null;
  engagement: number | null;
  engagementDriver: string | null;
  supportNeeded: string | null;
  goalsNextMonth: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMemberStatus {
  id: string;
  name: string;
  email: string;
  jobTitle?: string | null;
  team?: string | null;
  managerAssessmentId?: string | null;
  selfAssessmentStatus: "not_started" | "draft" | "submitted";
  managerAssessmentStatus: "not_started" | "draft" | "submitted";
  startedAt?: string | null;
  resultsSentAt: string | null;
  meetingId?: string | null;
  meetingStatus?: "SCHEDULED" | "IN_PROGRESS" | "COMPLETE" | null;
  meetingCompletedAt?: string | null;
  stage?: import("@/lib/assessment-stage").AssessmentStage;
}

export interface TaskData {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "COMPLETE";
  category: string | null;
  dueDate: string | null;
  meetingId: string | null;
  assignee: { id: string; name: string; email: string };
  createdBy: { id: string; name: string };
  meeting?: { id: string; type: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingData {
  id: string;
  type: "ONE_ON_ONE" | "PIP";
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETE";
  employeeId: string;
  managerId: string;
  cycleId: string | null;
  notes: string | null;
  startedAt: string | null;
  completedAt: string | null;
  tasks?: TaskData[];
  manager?: { id: string; name: string };
  employee?: { id: string; name: string };
}
