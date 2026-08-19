import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function PromptsPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Prompts</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Your prompts will appear here.
          </p>
        </div>
        <Button disabled>Create Prompt</Button>
      </header>

      <div className="border-border flex items-center justify-center rounded-xl border border-dashed py-20">
        <div className="text-center">
          <FileText className="text-muted-foreground mx-auto h-8 w-8" />
          <p className="mt-3 text-sm font-medium">No prompts yet</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Prompt management arrives in Phase 4.
          </p>
        </div>
      </div>
    </div>
  );
}
