"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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
    return <div className="text-center py-12 muted">Loading...</div>;
  }

  if (!resource) {
    return <div className="text-center py-12 muted">Resource not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/resources"
            className="inline-flex items-center gap-1 text-sm text-cobalt hover:underline"
          >
            <ArrowLeft size={14} strokeWidth={1.6} />
            Back to Resources
          </Link>
          <div className="flex items-center gap-2 mt-2">
            <h1 className="page-title">{resource.title}</h1>
            {!resource.published && <Badge variant="warning">Draft</Badge>}
          </div>
          <p className="mono tnum text-xs muted mt-1">
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
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-magenta-2"
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      <Card>
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: resource.content }}
        />
      </Card>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50">
          <div className="bg-paper rounded-xl border border-line shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="serif text-lg text-ink mb-2">Delete Resource?</h3>
            <p className="text-sm muted mb-4">
              Are you sure you want to delete &ldquo;{resource.title}&rdquo;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="magenta"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
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
