"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

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
      router.push("/login?registered=true");
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <Card>
        <CardContent>
          <p className="text-center py-8 text-gray-500">Validating invitation...</p>
        </CardContent>
      </Card>
    );
  }

  if (!invitation || invitation.usedAt) {
    return (
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold text-visory">Visory</h1>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500">
            {error || "This invitation is no longer valid."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h1 className="text-2xl font-bold text-visory">Welcome to Visory</h1>
        <p className="text-sm text-gray-600 mt-1">
          Hi {invitation.name}, set a password to complete your account setup.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-visory-navy mb-1">Email</label>
            <p className="text-sm text-visory-navy bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
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
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
