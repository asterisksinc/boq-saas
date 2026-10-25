import { redirect } from "next/navigation";

export default async function TemplateActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/templates/${id}?tab=Activity`);
}
