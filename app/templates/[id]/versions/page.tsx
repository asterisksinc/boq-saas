import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TemplateVersionsRedirectPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/templates/${id}?tab=Versions`);
}
