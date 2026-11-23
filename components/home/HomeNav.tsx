"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  { label: "Product", href: "#product" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Solutions", href: "#solutions" },
  { label: "Insights", href: "#insights" },
  { label: "Company", href: "#company" },
];

export default function HomeNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="rv-nav">
      <div className="rv-nav-inner">
        <a className="rv-logo" href="/" aria-label="RVYO home">
          RVYO
          <img src="/assets/home/nav-mark.svg" alt="" aria-hidden="true" />
        </a>

        <div className="rv-nav-right">
          <nav className="rv-nav-links" aria-label="Primary navigation">
            {links.map((link) => (
              <a href={link.href} key={link.label}>
                {link.label}
              </a>
            ))}
          </nav>
          <span className="rv-nav-divider" aria-hidden="true" />
          <a className="rv-nav-cta" href="/register">
            Get Started
          </a>
          <button
            className="rv-nav-toggle"
            type="button"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="rv-mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      <nav id="rv-mobile-nav" className={`rv-nav-mobile ${open ? "is-open" : ""}`} aria-label="Mobile navigation">
        {links.map((link) => (
          <a href={link.href} key={link.label} onClick={() => setOpen(false)}>
            {link.label}
          </a>
        ))}
        <a href="/login" onClick={() => setOpen(false)}>
          Sign in
        </a>
      </nav>
    </header>
  );
}
