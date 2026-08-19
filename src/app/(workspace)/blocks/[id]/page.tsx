import { notFound } from "next/navigation";

import { BlockEditor } from "@/features/blocks/block-editor";
import { getAuthUser } from "@/server/auth/session";
import { getBlock } from "@/server/repositories/block-repository";
import { isRedisConfigured } from "@/server/redis/client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BlockDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getAuthUser();

  if (!user || !isRedisConfigured) {
    notFound();
  }

  const block = await getBlock(user.uid, id);
  if (!block) {
    notFound();
  }

  return <BlockEditor key={block.id} block={block} />;
}
