import { redirect } from "next/navigation";

export default async function ArchivedTemplatesRedirectPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const sp = new URLSearchParams();
  sp.set("tab", "archived");
  if (searchParams) {
    for (const [key, val] of Object.entries(searchParams)) {
      if (key !== "tab" && typeof val === "string") {
        sp.set(key, val);
      }
    }
  }
  const query = sp.toString();
  if (query === "tab=archived") {
    redirect("/templates?tab=archived");
  }
  redirect(`/templates?${query}`);
}
