import { notFound } from "next/navigation";

import { PromptEditor } from "@/features/prompts/prompt-editor";
import { getAuthUser } from "@/server/auth/session";
import { getPrompt } from "@/server/repositories/prompt-repository";
import { isRedisConfigured } from "@/server/redis/client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PromptDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getAuthUser();

  if (!user || !isRedisConfigured) {
    notFound();
  }

  const prompt = await getPrompt(user.uid, id);
  if (!prompt) {
    notFound();
  }

  return <PromptEditor key={prompt.id} prompt={prompt} />;
}
