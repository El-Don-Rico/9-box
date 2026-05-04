"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AdminCycleProgress } from "@/components/cycle/admin-progress";
import type { TimelineRow } from "@/components/cycle/timeline";

interface CycleSummary {
  id: string;
  month: number;
  year: number;
  status: "OPEN" | "CLOSED";
}

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [cycle, setCycle] = useState<CycleSummary | null>(null);
  const [rows, setRows] = useState<TimelineRow[]>([]);

  useEffect(() => {
    if (session?.user?.role && session.user.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [session, router]);

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") return;
    fetch("/api/cycles")
      .then((r) => r.json())
      .then((cycles: CycleSummary[]) => {
        const recent = cycles.find((c) => c.status === "OPEN") || cycles[0];
        if (!recent) return;
        setCycle(recent);
        return fetch(`/api/cycles/${recent.id}/progress`).then((r) => (r.ok ? r.json() : null));
      })
      .then((data) => {
        if (data?.rows) setRows(data.rows);
      });
  }, [session]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-visory-navy">Admin</h1>
        <p className="text-sm text-gray-600 mt-1">System administration</p>
      </div>

      {cycle && rows.length > 0 && <AdminCycleProgress rows={rows} cycle={cycle} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/admin/cycles")}>
          <CardContent className="py-6">
            <h3 className="text-lg font-semibold text-visory-navy">Assessment Cycles</h3>
            <p className="text-sm text-gray-600 mt-1">Open, close, and manage monthly cycles</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/admin/users")}>
          <CardContent className="py-6">
            <h3 className="text-lg font-semibold text-visory-navy">User Management</h3>
            <p className="text-sm text-gray-600 mt-1">Add users, assign roles and managers</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
