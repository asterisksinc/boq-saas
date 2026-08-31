import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BOQ-SAAS",
  description: "From scope to BOQ to purchase order—built for commercial clarity.",
  icons: {
    icon: "/assets/boq-logo-small.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
