import { redirect } from "next/navigation";

export default async function TemplateWorkflowRulesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/templates/${id}?tab=Workflow&subtab=Rules`);
}
