"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";

const links = ["Home", "Product", "Features", "Pricing", "Solutions", "Insights", "Company"];

export default function MobileNav({ current }: { current: "Home" | "Pricing" }) {
  const [open, setOpen] = useState(false);

  const hrefFor = (label: string) => {
    if (label === "Home") return "/";
    if (label === "Pricing") return "/pricing";
    return `/#${label.toLowerCase()}`;
  };

  return <div className={`mobile-nav ${open ? "is-open" : ""}`}>
    <button
      className="mobile-menu"
      type="button"
      aria-label={open ? "Close navigation" : "Open navigation"}
      aria-expanded={open}
      aria-controls="mobile-navigation"
      onClick={() => setOpen(value => !value)}
    >
      {open ? <X /> : <Menu />}
    </button>
    <nav id="mobile-navigation" aria-label="Mobile navigation">
      {links.map(label => <a
        className={label === current ? "active-nav" : undefined}
        aria-current={label === current ? "page" : undefined}
        href={hrefFor(label)}
        key={label}
        onClick={() => setOpen(false)}
      >{label}</a>)}
    </nav>
  </div>;
}
