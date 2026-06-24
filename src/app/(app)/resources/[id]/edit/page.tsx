"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/toggle";
import { RichTextEditor } from "@/components/resources/rich-text-editor";
import { RoleSelector } from "@/components/resources/role-selector";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
    return <div className="text-center py-12 muted">Access denied.</div>;
  }

  if (loading) {
    return <div className="text-center py-12 muted">Loading...</div>;
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
        <Link
          href={`/resources/${id}`}
          className="inline-flex items-center gap-1 text-sm text-cobalt hover:underline mb-2"
        >
          <ArrowLeft size={14} strokeWidth={1.6} />
          Back to Resource
        </Link>
        <PageHeader eyebrow="Library" title={<>Edit <em>resource.</em></>} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resource Details</CardTitle>
        </CardHeader>
        <div className="space-y-4">
          <div>
            <label className="eyebrow block mb-1.5">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Resource title..."
            />
          </div>

          <div>
            <label className="eyebrow block mb-1.5">Content</label>
            <RichTextEditor content={content} onChange={setContent} />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={published} onChange={setPublished} />
            <span className="text-sm text-ink">
              Publish (visible to team members with matching roles)
            </span>
          </label>

          <RoleSelector selected={allowedRoles} onChange={setAllowedRoles} />

          {error && <p className="text-sm text-magenta-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Link href={`/resources/${id}`}>
              <Button variant="secondary">Cancel</Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
