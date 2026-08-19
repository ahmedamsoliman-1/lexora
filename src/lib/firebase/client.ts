"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

import { env } from "@/lib/env";

/**
 * Firebase client SDK singleton.
 *
 * Initialized from `NEXT_PUBLIC_FIREBASE_*` environment variables. When the
 * variables are absent the app remains runnable — `isFirebaseConfigured` is
 * `false` and the UI shows an appropriate "auth not configured" state instead
 * of crashing.
 */

export const isFirebaseConfigured = Boolean(
  env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
  env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  env.NEXT_PUBLIC_FIREBASE_APP_ID,
);

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;

if (isFirebaseConfigured) {
  firebaseApp = getApps().length
    ? getApp()
    : initializeApp({
        apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY!,
        authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
        projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
        appId: env.NEXT_PUBLIC_FIREBASE_APP_ID!,
      });
  firebaseAuth = getAuth(firebaseApp);
}

export { firebaseApp, firebaseAuth };

export const googleProvider = new GoogleAuthProvider();
