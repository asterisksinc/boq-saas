import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./templates-overview.css";
import "./boq-structure-redesign.css";
import "./boq-costing-redesign.css";
import "./boq-rules-redesign.css";
import "./boq-usage-redesign.css";
import "./boq-versions-redesign.css";
import "./boq-activity-redesign.css";
import { PermissionsProvider } from "@/components/PermissionsProvider";

export const metadata: Metadata = {
  title: "BOQ-SAAS",
  description: "From scope to BOQ to purchase order—built for commercial clarity.",
  icons: {
    icon: "/assets/boq-logo-small.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><PermissionsProvider>{children}</PermissionsProvider></body>
    </html>
  );
}
