export type { Role, MeetingStatus, TaskStatus } from "@prisma/client";
import type { MeetingStatus, TaskStatus } from "@prisma/client";

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
  meetingStatus?: MeetingStatus;
  createdAt: string;
  updatedAt: string;
  employee?: { id: string; name: string; email: string; role: string; team: string | null; jobTitle: string | null; startDate?: string | null };
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
  startDate?: string | null;
  selfAssessmentStatus: "not_started" | "draft" | "submitted";
  managerAssessmentStatus: "not_started" | "draft" | "submitted";
  meetingStatus?: MeetingStatus;
  managerAssessmentId?: string | null;
  resultsSentAt: string | null;
}

export interface TaskCommentData {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  createdAt: string;
  author?: { id: string; name: string };
}

export interface TaskData {
  id: string;
  title: string;
  description: string | null;
  employeeId: string;
  assigneeId: string | null;
  createdById: string;
  meetingId: string | null;
  dueDate: string | null;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  employee?: { id: string; name: string };
  assignee?: { id: string; name: string } | null;
  createdBy?: { id: string; name: string };
  comments?: TaskCommentData[];
}

export interface MeetingData {
  id: string;
  managerAssessmentId: string;
  notes: string | null;
  startedAt: string | null;
  completedAt: string | null;
  tasks?: TaskData[];
}
