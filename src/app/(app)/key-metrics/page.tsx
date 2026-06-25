"use client";

import { useSession } from "next-auth/react";
import { KeyMetricsSection } from "@/components/assessments/goals-metrics-sections";

export default function KeyMetricsPage() {
  const { data: session } = useSession();

  if (!session?.user?.id) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-visory-navy">Key Metrics</h1>
        <p className="text-sm text-gray-600 mt-1">Your recurring performance targets</p>
      </div>
      <KeyMetricsSection employeeId={session.user.id} canDelete />
    </div>
  );
}
