import { redirect } from "next/navigation";

export default async function TemplateDocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/templates/${id}?tab=Documents`);
}
