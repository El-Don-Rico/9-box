"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface InvitationData {
  name: string;
  email: string;
  role: string;
  usedAt: string | null;
}

export default function InviteRegisterPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch(`/api/auth/invite/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setInvitation(data);
        }
        setChecking(false);
      })
      .catch(() => {
        setError("Failed to validate invitation");
        setChecking(false);
      });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: invitation!.email,
          password,
          token,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }
      // Auto sign-in after successful registration
      const signInResult = await signIn("credentials", {
        email: invitation!.email,
        password,
        redirect: false,
      });
      if (signInResult?.ok) {
        router.push("/dashboard");
      } else {
        router.push("/login?registered=true");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <p className="text-center py-8 muted">Validating invitation…</p>
    );
  }

  if (!invitation || invitation.usedAt) {
    return (
      <div>
        <div className="eyebrow mb-2">Invitation</div>
        <h1 className="serif" style={{ fontSize: 32, letterSpacing: "-0.02em" }}>
          No longer <em style={{ fontStyle: "italic" }}>valid.</em>
        </h1>
        <p className="lead mt-1">
          {error || "This invitation is no longer valid."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="eyebrow mb-2">Welcome to Visory</div>
      <h1 className="serif" style={{ fontSize: 32, letterSpacing: "-0.02em" }}>
        Set your <em style={{ fontStyle: "italic" }}>password.</em>
      </h1>
      <p className="lead mt-1 mb-5">
        Hi {invitation.name}, set a password to complete your account setup.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="chip chip-magenta w-full justify-start">{error}</div>
        )}
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Email</label>
          <p className="text-sm text-ink bg-paper-2 rounded-lg px-3 py-2 border border-line">
            {invitation.email}
          </p>
        </div>
        <Input
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          required
          minLength={8}
        />
        <Input
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your password"
          required
        />
        <Button type="submit" variant="magenta" className="w-full" disabled={loading}>
          {loading ? "Creating account…" : "Create Account"}
        </Button>
      </form>
    </div>
  );
}
