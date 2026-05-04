import type { Role } from "@prisma/client";
import { prisma } from "./prisma";

export function isManager(role: Role): boolean {
  return role === "MANAGER" || role === "TEAM_LEAD" || role === "AREA_LEAD" || role === "ADMIN";
}

export function isAdmin(role: Role): boolean {
  return role === "ADMIN";
}

export function canViewAllAssessments(role: Role): boolean {
  return role === "ADMIN";
}

/**
 * Returns the list of employee IDs visible to the current user for assessment viewing.
 * - EMPLOYEE: only own data
 * - MANAGER: own direct reports
 * - TEAM_LEAD: own direct reports + their reports' direct reports (two levels)
 * - AREA_LEAD: every active user in the same Area (returns [] if the lead has no area set)
 * - ADMIN: everything
 */
export async function getVisibleEmployeeIds(
  userId: string,
  role: Role
): Promise<string[] | "all"> {
  switch (role) {
    case "ADMIN":
      return "all";

    case "AREA_LEAD": {
      const self = await prisma.user.findUnique({
        where: { id: userId },
        select: { area: true },
      });
      if (!self?.area) return [];
      const peers = await prisma.user.findMany({
        where: { area: self.area, isActive: true },
        select: { id: true },
      });
      return peers.map((p) => p.id);
    }

    case "TEAM_LEAD": {
      const directReports = await prisma.user.findMany({
        where: { managerId: userId, isActive: true },
        select: { id: true },
      });
      const directIds = directReports.map((r) => r.id);
      if (directIds.length === 0) return [];
      const skipLevel = await prisma.user.findMany({
        where: { managerId: { in: directIds }, isActive: true },
        select: { id: true },
      });
      return [...directIds, ...skipLevel.map((r) => r.id)];
    }

    case "MANAGER": {
      const reports = await prisma.user.findMany({
        where: { managerId: userId, isActive: true },
        select: { id: true },
      });
      return reports.map((r) => r.id);
    }

    case "EMPLOYEE":
    default:
      return [userId];
  }
}

/**
 * Returns Prisma where filter for manager assessments based on role.
 */
export async function getManagerAssessmentFilter(
  userId: string,
  role: Role
): Promise<Record<string, unknown>> {
  const visibleIds = await getVisibleEmployeeIds(userId, role);
  if (visibleIds === "all") return {};
  return { employeeId: { in: visibleIds } };
}
