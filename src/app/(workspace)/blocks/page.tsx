import { BlockList } from "@/features/blocks/block-list";
import { getAuthUser } from "@/server/auth/session";
import { listBlocks } from "@/server/repositories/block-repository";

export default async function BlocksPage() {
  const user = await getAuthUser();
  const blocks = user ? await listBlocks(user.uid).catch(() => []) : [];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Blocks</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {blocks.length > 0
              ? `${blocks.length} block${blocks.length === 1 ? "" : "s"}`
              : "Reusable blocks prevent you from repeating the same instructions across prompts."}
          </p>
        </div>
      </header>

      <BlockList blocks={blocks} />
    </div>
  );
}
