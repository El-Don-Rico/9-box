"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        body: JSON.stringify({ name, email, password }),
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

  return (
    <div>
      <div className="eyebrow mb-2">Get started</div>
      <h1 className="serif" style={{ fontSize: 32, letterSpacing: "-0.02em" }}>
        Create <em style={{ fontStyle: "italic" }}>account.</em>
      </h1>
      <p className="lead mt-1 mb-5">Register to join the Visory performance platform.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="chip chip-magenta w-full justify-start">{error}</div>
        )}
        <Input
          id="name"
          label="Full Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Smith"
          required
        />
        <Input
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
        />
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
      <p className="mt-4 text-center small muted">
        Already have an account?{" "}
        <Link href="/login" className="text-cobalt hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
