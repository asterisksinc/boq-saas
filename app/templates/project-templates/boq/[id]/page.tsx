import { redirect } from "next/navigation";

export default async function ProjectTemplateBoqDetailRedirect(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const sp = new URLSearchParams();
  if (searchParams) {
    for (const [key, val] of Object.entries(searchParams)) {
      if (typeof val === "string") {
        sp.set(key, val);
      }
    }
  }
  const query = sp.toString();
  redirect(`/templates/boq/${id}${query ? `?${query}` : ""}`);
}
