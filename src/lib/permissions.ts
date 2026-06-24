import type { Role } from "@prisma/client";
import { prisma } from "./prisma";

export function isManager(role: Role): boolean {
  return role === "MANAGER" || role === "AREA_LEAD" || role === "LEADERSHIP" || role === "ADMIN";
}

export function isAdmin(role: Role): boolean {
  return role === "ADMIN";
}

export function canViewAllAssessments(role: Role): boolean {
  return role === "LEADERSHIP" || role === "ADMIN";
}

/**
 * Returns the list of employee IDs visible to the current user for assessment viewing.
 * - EMPLOYEE: only sees own data (after 1:1 complete)
 * - MANAGER: sees own direct reports
 * - AREA_LEAD: sees all MANAGER-level reports (not LEADERSHIP)
 * - LEADERSHIP/ADMIN: sees everything
 */
export async function getVisibleEmployeeIds(
  userId: string,
  role: Role
): Promise<string[] | "all"> {
  switch (role) {
    case "LEADERSHIP":
    case "ADMIN":
      return "all";

    case "AREA_LEAD": {
      // Own direct reports + all MANAGER-role users' direct reports
      const managers = await prisma.user.findMany({
        where: { role: "MANAGER", isActive: true },
        select: { id: true },
      });
      const managerIds = [...managers.map((m) => m.id), userId];
      const employees = await prisma.user.findMany({
        where: { managerId: { in: managerIds }, isActive: true },
        select: { id: true },
      });
      return employees.map((e) => e.id);
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
 * True when the user can view/act on the given employee (own record, a managed
 * report, or leadership/admin). Reuses getVisibleEmployeeIds for the role rules.
 */
export async function canManageEmployee(
  userId: string,
  role: Role,
  employeeId: string
): Promise<boolean> {
  const visible = await getVisibleEmployeeIds(userId, role);
  if (visible === "all") return true;
  return visible.includes(employeeId);
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
