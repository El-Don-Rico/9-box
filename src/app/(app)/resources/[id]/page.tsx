"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Resource {
  id: string;
  title: string;
  slug: string;
  content: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string };
}

export default function ResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    fetch(`/api/resources/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setResource(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/resources/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/resources");
      }
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  if (!resource) {
    return <div className="text-center py-12 text-gray-500">Resource not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/resources" className="text-sm text-visory-link hover:underline">
            &larr; Back to Resources
          </Link>
          <div className="flex items-center gap-2 mt-2">
            <h1 className="text-2xl font-bold text-visory-navy">{resource.title}</h1>
            {!resource.published && (
              <Badge className="bg-amber-100 text-amber-800 border-amber-300">Draft</Badge>
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
          <div className="flex gap-2">
            <Link href={`/resources/${id}/edit`}>
              <Button size="sm">Edit</Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-600 hover:text-red-700"
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="py-6">
          <div
            className="prose prose-sm max-w-none prose-headings:font-heading prose-headings:text-visory-navy prose-a:text-visory-link prose-strong:text-visory-navy"
            dangerouslySetInnerHTML={{ __html: resource.content }}
          />
        </CardContent>
      </Card>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-visory-navy mb-2">Delete Resource?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete &ldquo;{resource.title}&rdquo;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
