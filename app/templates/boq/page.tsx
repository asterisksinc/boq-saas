import { redirect } from "next/navigation";

export default async function BoqTemplatesRedirectPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const sp = new URLSearchParams();
  sp.set("tab", "boqs");
  if (searchParams) {
    for (const [key, val] of Object.entries(searchParams)) {
      if (key !== "tab" && typeof val === "string") {
        sp.set(key, val);
      }
    }
  }
  const query = sp.toString();
  if (query === "tab=boqs") {
    redirect("/templates?tab=boqs");
  }
  redirect(`/templates?${query}`);
}
