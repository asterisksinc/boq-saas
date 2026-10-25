import { redirect } from "next/navigation";

export default async function ProjectTemplateWorkflowMilestonesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/templates/${id}?tab=Workflow&subtab=Milestones`);
}
