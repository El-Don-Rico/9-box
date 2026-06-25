"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="eyebrow mb-2">Welcome back</div>
      <h1 className="serif" style={{ fontSize: 32, letterSpacing: "-0.02em" }}>
        Sign <em style={{ fontStyle: "italic" }}>in.</em>
      </h1>
      <p className="lead mt-1 mb-5">Continue to Visory Performance &amp; Growth.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="chip chip-magenta w-full justify-start">{error}</div>
        )}
        <Input
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@visory.com"
          required
        />
        <Input
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
        />
        <Button type="submit" variant="magenta" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign In"}
        </Button>
      </form>
      <p className="mt-4 text-center small">
        <Link href="/forgot-password" className="text-cobalt hover:underline">
          Forgot password?
        </Link>
      </p>
      <p className="mt-2 text-center small muted">
        Have an invitation?{" "}
        <Link href="/join" className="text-cobalt hover:underline font-medium">
          Join here
        </Link>
      </p>
    </div>
  );
}
