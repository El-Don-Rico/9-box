"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCyclePeriod, getCurrentPeriod } from "@/lib/utils";
import type { CycleData } from "@/types";

export default function AdminCyclesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [cycles, setCycles] = useState<CycleData[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    loadCycles();
  }, [session, router]);

  function loadCycles() {
    fetch("/api/cycles").then((r) => r.json()).then(setCycles);
  }

  async function createCycle() {
    setCreating(true);
    const { month, year } = getCurrentPeriod();
    const res = await fetch("/api/cycles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, year }),
    });
    if (res.ok) loadCycles();
    setCreating(false);
  }

  async function toggleCycle(id: string, currentStatus: string) {
    const newStatus = currentStatus === "OPEN" ? "CLOSED" : "OPEN";
    await fetch("/api/cycles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    loadCycles();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-visory-navy">Assessment Cycles</h1>
          <p className="text-sm text-gray-600 mt-1">Manage monthly assessment cycles</p>
        </div>
        <Button onClick={createCycle} disabled={creating}>
          {creating ? "Creating..." : "Create Current Month Cycle"}
        </Button>
      </div>

      <Card>
        <CardContent>
          <div className="divide-y divide-gray-100">
            {cycles.map((cycle) => (
              <div key={cycle.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-visory-navy">
                    {formatCyclePeriod(cycle.month, cycle.year)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    className={
                      cycle.status === "OPEN"
                        ? "bg-green-100 text-green-800 border-green-300"
                        : "bg-gray-100 text-gray-800 border-gray-300"
                    }
                  >
                    {cycle.status}
                  </Badge>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => toggleCycle(cycle.id, cycle.status)}
                  >
                    {cycle.status === "OPEN" ? "Close" : "Reopen"}
                  </Button>
                </div>
              </div>
            ))}
            {cycles.length === 0 && (
              <p className="py-4 text-center text-sm text-gray-500">
                No cycles yet. Create one to start.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
