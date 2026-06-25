"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      // Still show the generic confirmation — we never reveal account existence.
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="eyebrow mb-2">Account recovery</div>
      <h1 className="serif" style={{ fontSize: 32, letterSpacing: "-0.02em" }}>
        Reset <em style={{ fontStyle: "italic" }}>password.</em>
      </h1>
      <p className="lead mt-1 mb-5">
        Enter your email and we&apos;ll send you a reset link.
      </p>
      {sent ? (
        <div className="space-y-4">
          <div className="chip chip-success w-full justify-start">
            If an account exists for that email, a password reset link is on its way. The link expires in 1 hour.
          </div>
          <Link href="/login" className="block text-center small text-cobalt hover:underline font-medium">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@visory.com"
            required
          />
          <Button type="submit" variant="magenta" className="w-full" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </Button>
          <Link href="/login" className="block text-center small text-cobalt hover:underline">
            Back to sign in
          </Link>
        </form>
      )}
    </div>
  );
}
