import { redirect } from "next/navigation";

export default async function TemplateWorkflowApprovalsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/templates/${id}?tab=Workflow&subtab=Approvals`);
}
