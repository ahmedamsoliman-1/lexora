export default function WorkspaceLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading page">
      <div className="space-y-2">
        <div className="bg-muted h-7 w-40 animate-pulse rounded-md" />
        <div className="bg-muted h-4 w-64 animate-pulse rounded-md" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="border-border bg-surface h-32 animate-pulse rounded-lg border"
          />
        ))}
      </div>
      <span className="sr-only">Loading page…</span>
    </div>
  );
}
