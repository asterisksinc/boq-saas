import { redirect } from "next/navigation";

export default function BoqTemplatesRedirectPage() {
  redirect("/templates?tab=boqs");
}
