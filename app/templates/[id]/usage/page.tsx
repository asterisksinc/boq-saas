import { redirect } from "next/navigation";

export default async function TemplateUsagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/templates/${id}?tab=Usage`);
}
