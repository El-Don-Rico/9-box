"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/resources/rich-text-editor";
import { RoleSelector } from "@/components/resources/role-selector";
import Link from "next/link";

const ALL_ROLES = ["EMPLOYEE", "MANAGER", "AREA_LEAD", "LEADERSHIP", "ADMIN"];

interface Resource {
  id: string;
  title: string;
  content: string;
  published: boolean;
  allowedRoles: string[];
}

export default function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(false);
  const [allowedRoles, setAllowedRoles] = useState<string[]>(ALL_ROLES);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/resources/${id}`)
      .then((r) => r.json())
      .then((data: Resource) => {
        setTitle(data.title);
        setContent(data.content);
        setPublished(data.published);
        setAllowedRoles(data.allowedRoles || ALL_ROLES);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (session?.user?.role !== "ADMIN") {
    return <div className="text-center py-12 text-gray-500">Access denied.</div>;
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  async function handleSave() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (allowedRoles.length === 0) {
      setError("Select at least one role");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/resources/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, published, allowedRoles }),
      });
      if (res.ok) {
        router.push(`/resources/${id}`);
      } else {
        const err = await res.json();
        setError(err.error || "Failed to update resource");
      }
    } catch {
      setError("Failed to update resource");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/resources/${id}`} className="text-sm text-visory-link hover:underline">
          &larr; Back to Resource
        </Link>
        <h1 className="text-2xl font-bold text-visory-navy mt-2">Edit Resource</h1>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Resource Details</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-visory-navy mb-1">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Resource title..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-visory-navy mb-1">Content</label>
            <RichTextEditor content={content} onChange={setContent} />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="published"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="rounded border-visory-border"
            />
            <label htmlFor="published" className="text-sm text-visory-navy">
              Publish (visible to team members with matching roles)
            </label>
          </div>

          <RoleSelector selected={allowedRoles} onChange={setAllowedRoles} />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Link href={`/resources/${id}`}>
              <Button variant="secondary">Cancel</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
