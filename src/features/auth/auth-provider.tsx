"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";

import {
  firebaseAuth,
  googleProvider,
  isFirebaseConfigured,
} from "@/lib/firebase/client";
import type { AuthUser } from "@/types";

interface AuthContextValue {
  /** The authenticated user, or `null` when signed out. */
  user: AuthUser | null;
  /** `true` until the initial auth state has been resolved. */
  loading: boolean;
  /** Whether Firebase client env vars are present. */
  configured: boolean;
  /** Last error message from a failed auth operation. */
  error: string | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toAuthUser(user: FirebaseUser): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

/**
 * Sync a Firebase ID token with the BFF by creating a session cookie.
 * Called after every successful sign-in so server components can verify the
 * session via the httpOnly cookie.
 */
async function syncSessionCookie(idToken: string): Promise<void> {
  await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
}

async function clearSessionCookie(): Promise<void> {
  await fetch("/api/auth/session", { method: "DELETE" });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !firebaseAuth) {
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      if (fbUser) {
        setUser(toAuthUser(fbUser));
        try {
          const idToken = await fbUser.getIdToken();
          await syncSessionCookie(idToken);
        } catch {
          // Cookie sync is best-effort; the client user is still valid.
        }
      } else {
        setUser(null);
        await clearSessionCookie().catch(() => {});
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      setError(null);
      if (!firebaseAuth) return;
      try {
        await signInWithEmailAndPassword(firebaseAuth, email, password);
      } catch (err) {
        setError(extractAuthMessage(err));
        throw err;
      }
    },
    [],
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string, displayName?: string) => {
      setError(null);
      if (!firebaseAuth) return;
      try {
        const credential = await createUserWithEmailAndPassword(
          firebaseAuth,
          email,
          password,
        );
        if (displayName) {
          await updateProfile(credential.user, { displayName });
        }
        setUser(toAuthUser(credential.user));
      } catch (err) {
        setError(extractAuthMessage(err));
        throw err;
      }
    },
    [],
  );

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    if (!firebaseAuth) return;
    try {
      await signInWithPopup(firebaseAuth, googleProvider);
    } catch (err) {
      setError(extractAuthMessage(err));
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    if (firebaseAuth) {
      await firebaseSignOut(firebaseAuth);
    }
    await clearSessionCookie().catch(() => {});
    setUser(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      configured: isFirebaseConfigured,
      error,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signOut,
      clearError,
    }),
    [
      user,
      loading,
      error,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signOut,
      clearError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>.");
  }
  return ctx;
}

/**
 * Extract a human-readable message from a Firebase Auth error. Falls back to a
 * generic message for unexpected shapes so the UI never shows raw internals.
 */
function extractAuthMessage(err: unknown): string {
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = String((err as { code: unknown }).code);
    switch (code) {
      case "auth/invalid-email":
        return "That doesn't look like a valid email address.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Invalid email or password.";
      case "auth/email-already-in-use":
        return "An account with this email already exists.";
      case "auth/weak-password":
        return "Password should be at least 8 characters.";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again later.";
      case "auth/popup-closed-by-user":
        return "The sign-in popup was closed before completing.";
      case "auth/operation-not-allowed":
        return "This sign-in method is not enabled.";
      default:
        break;
    }
  }
  return "Something went wrong. Please try again.";
}
