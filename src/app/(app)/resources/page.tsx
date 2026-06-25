"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { getRoleDisplayName } from "@/lib/utils";
import { FileText, GripVertical } from "lucide-react";

const ALL_ROLES = ["EMPLOYEE", "MANAGER", "AREA_LEAD", "LEADERSHIP", "ADMIN"];

interface Resource {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  sortOrder: number;
  allowedRoles: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string };
}

export default function ResourcesPage() {
  const { data: session } = useSession();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = session?.user?.role === "ADMIN";

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    fetch("/api/resources")
      .then((r) => r.json())
      .then((data) => {
        setResources(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleDragStart = useCallback((index: number) => {
    dragItem.current = index;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragOverItem.current = index;
  }, []);

  const handleDrop = useCallback(async () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    const reordered = [...resources];
    const [moved] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOverItem.current, 0, moved);

    setResources(reordered);
    dragItem.current = null;
    dragOverItem.current = null;

    await fetch("/api/resources/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: reordered.map((r) => r.id) }),
    });
  }, [resources]);

  if (loading) {
    return <div className="text-center py-12 muted">Loading...</div>;
  }

  const isRestricted = (r: Resource) =>
    r.allowedRoles.length < ALL_ROLES.length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Library"
        title={<>Resource <em>library.</em></>}
        sub="Guides, documentation, and reference materials for the team"
        actions={
          isAdmin ? (
            <Link href="/resources/new">
              <Button variant="magenta" size="sm">New Resource</Button>
            </Link>
          ) : undefined
        }
      />

      {resources.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="muted">No resources available yet.</p>
          {isAdmin && (
            <Link href="/resources/new">
              <Button variant="magenta" size="sm" className="mt-4">
                Create your first resource
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="grid-12">
          {resources.map((resource, index) => (
            <div
              key={resource.id}
              draggable={isAdmin}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={handleDrop}
              className={`col-4${isAdmin ? " cursor-grab active:cursor-grabbing" : ""}`}
            >
              <Link href={`/resources/${resource.id}`} className="block h-full">
                <Card hover className="flex h-full flex-col cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-paper-2 border border-line text-ink-2">
                      <FileText size={18} strokeWidth={1.6} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="serif text-lg leading-snug text-ink">
                        {resource.title}
                      </h2>
                    </div>
                    {isAdmin && (
                      <div
                        className="mt-0.5 shrink-0 text-ink-4 select-none"
                        title="Drag to reorder"
                        onClick={(e) => e.preventDefault()}
                      >
                        <GripVertical size={16} strokeWidth={1.6} />
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {!resource.published && (
                      <Badge variant="warning">Draft</Badge>
                    )}
                    {isAdmin && isRestricted(resource) && (
                      <Badge variant="navy">
                        {resource.allowedRoles.map((r) => getRoleDisplayName(r)).join(", ")}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-auto pt-4 flex items-center justify-between gap-2">
                    <p className="mono tnum text-xs muted">
                      By {resource.createdBy.name} &middot;{" "}
                      {new Date(resource.updatedAt).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    {isAdmin && (
                      <Link
                        href={`/resources/${resource.id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="secondary" size="sm">
                          Edit
                        </Button>
                      </Link>
                    )}
                  </div>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
