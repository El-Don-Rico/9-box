"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Resource {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string };
}

export default function ResourcesPage() {
  const { data: session } = useSession();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    fetch("/api/resources")
      .then((r) => r.json())
      .then((data) => {
        setResources(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

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
        <div className="grid gap-4">
          {resources.map((resource) => (
            <Link key={resource.id} href={`/resources/${resource.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-visory-navy">
                          {resource.title}
                        </h2>
                        {!resource.published && (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs">
                            Draft
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
          ))}
        </div>
      )}
    </div>
  );
}
