import React from "react";
import { MoodBoardTemplateLayout } from "./types";

export interface LayoutTemplateOption {
  id: MoodBoardTemplateLayout;
  name: string;
  subtitle: string;
  description: string;
}

export const LAYOUT_TEMPLATES: LayoutTemplateOption[] = [
  {
    id: "grid-4x4",
    name: "Grid 4 × 4",
    subtitle: "Uniform & Balanced",
    description: "Consistent 4-column balanced grid with uniform spacing and captions underneath.",
  },
  {
    id: "collage",
    name: "Collage",
    subtitle: "Asymmetric & Artistic",
    description: "Mixed image sizes and creative asymmetric mosaic arrangement with layered visual hierarchy.",
  },
  {
    id: "modern",
    name: "Modern",
    subtitle: "Geometric & Clean",
    description: "Balanced rectangular blocks, sleek thin borders, and architectural editorial rhythm.",
  },
  {
    id: "minimal",
    name: "Minimal",
    subtitle: "Spacious & Serene",
    description: "Generous whitespace with large featured imagery and understated gallery typography.",
  },
  {
    id: "magazine",
    name: "Magazine",
    subtitle: "Editorial & Feature",
    description: "Dominant hero feature image with supporting detail cards and publication-style titles.",
  },
  {
    id: "split",
    name: "Split",
    subtitle: "Dual Column Flow",
    description: "Structured two-column visual split arrangement with distinct visual streams.",
  },
];
