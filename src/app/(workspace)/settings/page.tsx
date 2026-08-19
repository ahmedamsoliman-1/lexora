import { getAuthUser } from "@/server/auth/session";
import { isFirebaseAdminConfigured } from "@/server/auth/firebase-admin";

export default async function SettingsPage() {
  const user = await getAuthUser();
  const configured = isFirebaseAdminConfigured;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your account and preferences.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          Account
        </h2>
        <div className="border-border bg-surface rounded-xl border p-5">
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Display name</dt>
              <dd className="font-medium">{user?.displayName ?? "Not set"}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{user?.email ?? "—"}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">User ID</dt>
              <dd className="font-mono text-xs">{user?.uid ?? "—"}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Auth status</dt>
              <dd>
                {configured ? (
                  <span className="text-success">Configured</span>
                ) : (
                  <span className="text-warning">Not configured</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          Appearance
        </h2>
        <div className="border-border bg-surface rounded-xl border p-5">
          <p className="text-muted-foreground text-sm">
            Theme, editor width, and font size preferences arrive in a later
            phase.
          </p>
        </div>
      </section>
    </div>
  );
}
