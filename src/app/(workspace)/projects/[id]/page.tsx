import { notFound } from "next/navigation";

import { ProjectDetailClient } from "@/features/projects/project-detail-client";
import { getAuthUser } from "@/server/auth/session";
import { getProject } from "@/server/repositories/project-repository";
import { isRedisConfigured } from "@/server/redis/client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getAuthUser();

  if (!user || !isRedisConfigured) {
    notFound();
  }

  const project = await getProject(user.uid, id);
  if (!project) {
    notFound();
  }

  return <ProjectDetailClient project={project} />;
}
