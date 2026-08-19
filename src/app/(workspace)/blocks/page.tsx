import { Layers } from "lucide-react";

export default function BlocksPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Blocks</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Reusable blocks prevent you from repeating the same instructions
          across prompts.
        </p>
      </header>

      <div className="border-border flex items-center justify-center rounded-xl border border-dashed py-20">
        <div className="text-center">
          <Layers className="text-muted-foreground mx-auto h-8 w-8" />
          <p className="mt-3 text-sm font-medium">No blocks yet</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Block management arrives in Phase 6.
          </p>
        </div>
      </div>
    </div>
  );
}
