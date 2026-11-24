"use client";

import { useEffect, useLayoutEffect } from "react";
import Lenis from "lenis";

// Elements that fade/slide in as they scroll into view (home page only).
const REVEAL_SELECTORS = [
  ".rv-trusted",
  ".rv-section-head",
  ".rv-feature-card",
  ".rv-workflow-head",
  ".rv-workflow-shot",
  ".rv-point",
  ".rv-dark-frame",
  ".rv-integrations > *",
  ".rv-pricing > *",
  ".rv-testimonials .rv-section-head",
  ".rv-testimonial-col",
  ".rv-cta",
  ".rv-footer .rv-container",
];

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function HomeEffects() {
  // Smooth scrolling (Lenis)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.1, anchors: { offset: -64 } });
    let frame = requestAnimationFrame(function raf(time) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    });
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  // Scroll reveal. Hidden state is applied from JS so the page stays fully visible without it.
  useIsoLayoutEffect(() => {
    const root = document.querySelector<HTMLElement>(".rv-home");
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targets = Array.from(new Set(root.querySelectorAll<HTMLElement>(REVEAL_SELECTORS.join(","))));
    // Stagger siblings that reveal together (e.g. cards in one row).
    const seen = new Map<Element, number>();
    targets.forEach((el) => {
      const index = seen.get(el.parentElement as Element) ?? 0;
      seen.set(el.parentElement as Element, index + 1);
      el.style.setProperty("--rv-delay", `${Math.min(index, 4) * 80}ms`);
      el.classList.add("rv-reveal");
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    targets.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      targets.forEach((el) => el.classList.remove("rv-reveal", "is-visible"));
    };
  }, []);

  return null;
}
