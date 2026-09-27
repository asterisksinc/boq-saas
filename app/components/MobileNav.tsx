"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import { useState } from "react";
import { marketingSolutions } from "@/lib/marketing-solutions";

const links = ["Home", "Pricing", "Solutions"];

export default function MobileNav({ current }: { current: "Home" | "Pricing" | "Solutions" }) {
  const [open, setOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(current === "Solutions");

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
      {links.map(label => label === "Solutions" ? <div className={`mobile-solution-group ${solutionsOpen ? "is-open" : ""}`} key={label}>
        <button
          className={label === current ? "active-nav" : undefined}
          type="button"
          aria-expanded={solutionsOpen}
          onClick={() => setSolutionsOpen(value => !value)}
        >{label}<ChevronDown /></button>
        <div className="mobile-solution-panel">
          {marketingSolutions.map(solution => <a className="mobile-solution-link" href={`/solutions/${solution.slug}`} key={solution.slug} onClick={() => setOpen(false)}>{solution.title}</a>)}
        </div>
      </div> : <a
        className={label === current ? "active-nav" : undefined}
        aria-current={label === current ? "page" : undefined}
        href={hrefFor(label)}
        key={label}
        onClick={() => setOpen(false)}
      >{label}</a>)}
    </nav>
  </div>;
}
