import { redirect } from "next/navigation";

export default async function TemplateWorkflowViewRulePage({
  params,
}: {
  params: Promise<{ id: string; ruleId: string }>;
}) {
  const { id, ruleId } = await params;
  redirect(`/templates/${id}?tab=Workflow&subtab=Rules&rule=${ruleId}`);
}
