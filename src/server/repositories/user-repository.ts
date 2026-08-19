import type { UserProfile, UserPreferences } from "@/types/domain";
import { createId } from "@/server/ids";
import { keys, indexes } from "@/server/redis/keys";
import { now } from "@/server/redis/serialize";
import {
  addToIndex,
  deleteEntity,
  getEntity,
  setEntity,
  toScore,
} from "@/server/repositories/base";
import type { AuthUser } from "@/types";

/**
 * Default preferences applied when bootstrapping a new user.
 * @see docs/master-plan.md §11 User
 */
export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "system",
  writingLanguage: "en-US",
  autoCheckWriting: true,
  editorFontSize: 15,
  editorWidth: "comfortable",
  reducedMotion: false,
};

/**
 * Get a user profile by UID. Returns `null` when the user has not been
 * bootstrapped yet.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  return getEntity<UserProfile>(keys.user(uid));
}

/**
 * Bootstrap a user profile from a Firebase auth user on first sign-in.
 * If the profile already exists, the cached profile is returned unchanged so
 * this is safe to call on every session creation.
 */
export async function bootstrapUser(authUser: AuthUser): Promise<UserProfile> {
  const existing = await getUserProfile(authUser.uid);
  if (existing) {
    return existing;
  }

  const timestamp = now();
  const profile: UserProfile = {
    id: createId("usr"),
    uid: authUser.uid,
    displayName: authUser.displayName ?? undefined,
    email: authUser.email ?? undefined,
    photoUrl: authUser.photoURL ?? undefined,
    preferences: DEFAULT_PREFERENCES,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await setEntity(keys.user(authUser.uid), profile);
  await addToIndex(
    indexes.userProjects(authUser.uid),
    profile.id,
    toScore(timestamp),
  ).catch(() => {
    // Index population is best-effort; the user record is the source of truth.
  });

  return profile;
}

/** Update a user's preferences. */
export async function updatePreferences(
  uid: string,
  preferences: Partial<UserPreferences>,
): Promise<UserProfile> {
  const existing = await getUserProfile(uid);
  if (!existing) {
    throw new Error(`User profile not found for uid: ${uid}`);
  }

  const updated: UserProfile = {
    ...existing,
    preferences: { ...existing.preferences, ...preferences },
    updatedAt: now(),
  };

  await setEntity(keys.user(uid), updated);
  return updated;
}

/** Delete a user profile and its indexes. */
export async function deleteUserProfile(uid: string): Promise<void> {
  await deleteEntity(keys.user(uid));
}
