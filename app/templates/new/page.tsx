"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewTemplatePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/templates?tab=projects&new=true");
  }, [router]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#F1F5F9" }}>
      <div style={{ fontFamily: "'Urbanist', Inter, sans-serif", color: "#64748B", fontSize: "16px" }}>
        Opening template creator...
      </div>
    </div>
  );
}
