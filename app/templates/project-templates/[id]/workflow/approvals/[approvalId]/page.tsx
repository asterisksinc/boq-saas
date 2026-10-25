import { redirect } from "next/navigation";

export default async function ProjectTemplateViewApprovalRoutePage({
  params,
}: {
  params: Promise<{ id: string; approvalId: string }>;
}) {
  const { id, approvalId } = await params;
  redirect(`/templates/${id}?tab=Workflow&subtab=Approvals&flow=${approvalId}`);
}
