import {
  cert,
  getApps,
  initializeApp,
  type App as AdminApp,
} from "firebase-admin/app";
import { getAuth, type Auth as AdminAuth } from "firebase-admin/auth";

import { env } from "@/lib/env";

/**
 * Firebase Admin SDK singleton (server-only).
 *
 * Initialized from the `FIREBASE_*` service-account environment variables.
 * When the variables are absent the app remains runnable —
 * `isFirebaseAdminConfigured` is `false` and route handlers respond with a
 * normalized "auth not configured" error instead of crashing.
 *
 * This module must never be imported from client code. It reads server-only
 * environment variables and holds Admin credentials.
 */

export const isFirebaseAdminConfigured = Boolean(
  env.FIREBASE_PROJECT_ID &&
  env.FIREBASE_CLIENT_EMAIL &&
  env.FIREBASE_PRIVATE_KEY,
);

let adminApp: AdminApp | null = null;
let adminAuth: AdminAuth | null = null;

if (isFirebaseAdminConfigured) {
  adminApp =
    getApps().length > 0
      ? getApps()[0]!
      : initializeApp({
          credential: cert({
            projectId: env.FIREBASE_PROJECT_ID!,
            clientEmail: env.FIREBASE_CLIENT_EMAIL!,
            // The private key is stored with literal "\n" sequences in .env
            // files; convert them to real newlines before passing to Admin.
            privateKey: env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
          }),
        });
  adminAuth = getAuth(adminApp);
}

export { adminApp, adminAuth };

/** Session cookie lifetime in milliseconds (14 days). */
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 14 * 1000;
