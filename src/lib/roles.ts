import type { Role } from "@prisma/client";

export function isManager(role: Role): boolean {
  return role === "MANAGER" || role === "AREA_LEAD" || role === "LEADERSHIP" || role === "ADMIN";
}

export function isAdmin(role: Role): boolean {
  return role === "ADMIN";
}

export function canViewAllAssessments(role: Role): boolean {
  return role === "LEADERSHIP" || role === "ADMIN";
}
