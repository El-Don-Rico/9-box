"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (res.ok) {
        setDone(true);
        setTimeout(() => router.push("/login"), 1500);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not reset password");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="eyebrow mb-2">Account recovery</div>
      <h1 className="serif" style={{ fontSize: 32, letterSpacing: "-0.02em" }}>
        New <em style={{ fontStyle: "italic" }}>password.</em>
      </h1>
      <p className="lead mt-1 mb-5">Choose a new password for your account.</p>
      {done ? (
        <div className="chip chip-success w-full justify-start">
          Password updated. Redirecting you to sign in…
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="chip chip-magenta w-full justify-start">{error}</div>
          )}
          <Input
            id="password"
            label="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
          />
          <Input
            id="confirm"
            label="Confirm password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter your new password"
            required
          />
          <Button type="submit" variant="magenta" className="w-full" disabled={loading}>
            {loading ? "Saving…" : "Update password"}
          </Button>
          <Link href="/login" className="block text-center small text-cobalt hover:underline">
            Back to sign in
          </Link>
        </form>
      )}
    </div>
  );
}
