"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Kind = "NOTE" | "MEETING_LINK" | "TRANSCRIPT" | "SUMMARY";

interface ReviewNoteData {
  id: string;
  kind: Kind;
  title: string | null;
  body: string | null;
  url: string | null;
  createdAt: string;
  author: { id: string; name: string };
}

const KIND_LABELS: Record<Kind, string> = {
  NOTE: "Note",
  MEETING_LINK: "Meeting link",
  TRANSCRIPT: "Transcript",
  SUMMARY: "Summary",
};

export function ReviewNotesPanel({
  employeeId,
  cycleId,
  currentUserId,
}: {
  employeeId: string;
  cycleId: string;
  currentUserId?: string;
}) {
  const [notes, setNotes] = useState<ReviewNoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [kind, setKind] = useState<Kind>("NOTE");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/review-notes?cycleId=${cycleId}&employeeId=${employeeId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setNotes(Array.isArray(d) ? d : []))
      .catch(() => setNotes([]))
      .finally(() => setLoading(false));
  }, [cycleId, employeeId]);

  async function save() {
    if (!body.trim() && !url.trim()) {
      setError("Add a note or paste a link/transcript.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/review-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycleId, employeeId, kind, title, body, url }),
      });
      if (res.ok) {
        const note = await res.json();
        setNotes((prev) => [note, ...prev]);
        setTitle("");
        setBody("");
        setUrl("");
        setKind("NOTE");
        setShowForm(false);
      } else {
        const e = await res.json().catch(() => ({}));
        setError(e.error || `Failed to save (${res.status})`);
      }
    } catch {
      setError("Network error while saving");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/review-notes?id=${id}`, { method: "DELETE" });
    if (res.ok) setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  if (loading) return null;

  return (
    <div className="rounded-lg border border-line bg-paper">
      <div className="flex items-center justify-between px-4 py-3 border-b border-line">
        <div>
          <div className="eyebrow">Records</div>
          <p className="text-sm font-medium text-ink">Review Notes &amp; Meeting Records</p>
          <p className="text-xs text-ink-3">Notes, meeting links, transcripts or summaries</p>
        </div>
        {!showForm && (
          <Button size="sm" variant="secondary" onClick={() => setShowForm(true)}>
            Add
          </Button>
        )}
      </div>

      <div className="p-4 space-y-3">
        {showForm && (
          <div className="rounded-lg border border-line p-3 space-y-2">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(KIND_LABELS) as Kind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    kind === k
                      ? "border-magenta bg-magenta-3 text-magenta-2 font-medium"
                      : "border-line-2 text-ink-2 hover:border-ink-3"
                  }`}
                >
                  {KIND_LABELS[k]}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (optional)"
              className="w-full rounded-lg border border-line-2 bg-paper px-3 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-magenta"
            />
            {(kind === "MEETING_LINK" || kind === "SUMMARY") && (
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Link to meeting notes / recording (optional)"
                className="w-full rounded-lg border border-line-2 bg-paper px-3 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-magenta"
              />
            )}
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={
                kind === "TRANSCRIPT"
                  ? "Paste the meeting transcript or summary..."
                  : "Write a note..."
              }
              rows={kind === "TRANSCRIPT" ? 6 : 3}
              className="w-full rounded-lg border border-line-2 bg-paper px-3 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-magenta"
            />
            {error && <p className="text-xs text-magenta">{error}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={save} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setError(null); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {notes.length === 0 && !showForm ? (
          <p className="text-sm text-ink-3 text-center py-2">No notes yet.</p>
        ) : (
          notes.map((n) => (
            <div key={n.id} className="rounded-lg border border-line p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="slate">{KIND_LABELS[n.kind]}</Badge>
                  {n.title && <span className="text-sm font-medium text-ink">{n.title}</span>}
                </div>
                {currentUserId === n.author.id && (
                  <button onClick={() => remove(n.id)} className="text-xs text-ink-3 hover:text-magenta shrink-0">
                    Delete
                  </button>
                )}
              </div>
              {n.url && (
                <a href={n.url} target="_blank" rel="noopener noreferrer" className="text-sm text-navy hover:underline break-all">
                  {n.url}
                </a>
              )}
              {n.body && <p className="mt-1 text-sm text-ink-2 whitespace-pre-wrap">{n.body}</p>}
              <p className="mt-2 text-xs text-ink-3">
                {n.author.name} · <span className="mono tnum">{new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
