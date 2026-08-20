"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import { getAuthErrorMessage, useAuth } from "@/features/auth/auth-provider";

export default function RegisterPage() {
  const router = useRouter();
  const { signUpWithEmail, signInWithGoogle, configured } = useAuth();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signUpWithEmail(email, password, displayName || undefined);
      toast("Account created", { variant: "success" });
      router.push("/");
      router.refresh();
    } catch (err) {
      const message = getAuthErrorMessage(err);
      setError(message);
      toast("Could not create account", {
        description: message,
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
      toast("Signed in successfully", { variant: "success" });
      router.push("/");
      router.refresh();
    } catch (err) {
      const message = getAuthErrorMessage(err);
      setError(message);
      toast("Google sign-in failed", {
        description: message,
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (!configured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>
            Authentication is not configured. Set the Firebase environment
            variables to enable registration.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>
          Start organizing your prompts and reusable text.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogle}
          disabled={submitting}
        >
          {submitting ? <Spinner label="Opening Google" /> : null}
          {submitting ? "Opening Google..." : "Continue with Google"}
        </Button>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="border-border w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card text-muted-foreground px-2">or</span>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">Display name (optional)</Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={submitting}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              placeholder="At least 8 characters"
            />
          </div>
          {error && (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Spinner label="Creating account" /> : null}
            {submitting ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-muted-foreground text-sm">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
