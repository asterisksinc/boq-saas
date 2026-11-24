"use client";

import { useEffect, useState } from "react";

type Item = { id: string; label: string };

export default function DarkWorkflowIndex({ items }: { items: Item[] }) {
  const [active, setActive] = useState(items[items.length - 1]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    items.forEach((item) => {
      const node = document.getElementById(item.id);
      if (node) observer.observe(node);
    });
    return () => observer.disconnect();
  }, [items]);

  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>
          <a href={`#${item.id}`} className={active === item.id ? "is-active" : undefined}>
            <i aria-hidden="true" />
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
