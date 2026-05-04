"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRoleDisplayName } from "@/lib/utils";

const ALL_ROLES = ["EMPLOYEE", "MANAGER", "TEAM_LEAD", "AREA_LEAD", "ADMIN"];

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
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  const isRestricted = (r: Resource) =>
    r.allowedRoles.length < ALL_ROLES.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-visory-navy">Resources</h1>
          <p className="text-sm text-visory-mid-grey mt-1">
            Guides, documentation, and reference materials for the team
          </p>
        </div>
        {isAdmin && (
          <Link href="/resources/new">
            <Button size="sm">New Resource</Button>
          </Link>
        )}
      </div>

      {resources.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-visory-mid-grey">No resources available yet.</p>
            {isAdmin && (
              <Link href="/resources/new">
                <Button size="sm" className="mt-4">
                  Create your first resource
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {resources.map((resource, index) => (
            <div
              key={resource.id}
              draggable={isAdmin}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={handleDrop}
              className={isAdmin ? "cursor-grab active:cursor-grabbing" : ""}
            >
              <Link href={`/resources/${resource.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {isAdmin && (
                          <div
                            className="mt-1 text-gray-400 select-none flex-shrink-0"
                            title="Drag to reorder"
                            onClick={(e) => e.preventDefault()}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                            </svg>
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-lg font-semibold text-visory-navy">
                              {resource.title}
                            </h2>
                            {!resource.published && (
                              <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs">
                                Draft
                              </Badge>
                            )}
                            {isAdmin && isRestricted(resource) && (
                              <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                {resource.allowedRoles.map((r) => getRoleDisplayName(r)).join(", ")}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-visory-mid-grey mt-1">
                            By {resource.createdBy.name} &middot; Updated{" "}
                            {new Date(resource.updatedAt).toLocaleDateString("en-AU", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
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
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
