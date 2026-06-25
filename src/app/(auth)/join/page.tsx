"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function JoinPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/auth/join?email=${encodeURIComponent(email.trim())}`);
      const data = await res.json();

      if (data.found) {
        setName(data.name);
        setEmail(data.email);
        setStep("password");
      } else if (data.reason === "already_registered") {
        setError("This email is already registered. Try signing in instead.");
      } else {
        setError("No invitation found for this email. Contact your admin to get invited.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        router.push("/login?registered=true");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="eyebrow mb-2">
        {step === "email" ? "Get started" : `Welcome, ${name}`}
      </div>
      <h1 className="serif" style={{ fontSize: 32, letterSpacing: "-0.02em" }}>
        Join <em style={{ fontStyle: "italic" }}>Visory.</em>
      </h1>
      <p className="lead mt-1 mb-5">
        {step === "email"
          ? "Enter your email to get started."
          : "Set a password to finish your account."}
      </p>
      {step === "email" ? (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          {error && (
            <div className="chip chip-magenta w-full justify-start">{error}</div>
          )}
          <Input
            id="email"
            label="Work Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
          />
          <Button type="submit" variant="magenta" className="w-full" disabled={loading}>
            {loading ? "Checking…" : "Continue"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="space-y-4">
          {error && (
            <div className="chip chip-magenta w-full justify-start">{error}</div>
          )}
          <div className="rounded-lg bg-paper-2 border border-line p-3">
            <p className="text-sm text-ink">
              <span className="font-medium">{name}</span>
              <br />
              <span className="muted">{email}</span>
            </p>
          </div>
          <Input
            id="password"
            label="Create Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
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
          <button
            type="button"
            onClick={() => { setStep("email"); setError(""); setPassword(""); setConfirmPassword(""); }}
            className="block w-full text-center small muted hover:text-ink"
          >
            Use a different email
          </button>
        </form>
      )}
      <p className="mt-4 text-center small muted">
        Already have an account?{" "}
        <Link href="/login" className="text-cobalt hover:underline font-medium">
          Sign In
        </Link>
      </p>
    </div>
  );
}
