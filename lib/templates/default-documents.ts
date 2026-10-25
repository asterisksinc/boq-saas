export interface TemplateDocumentItem {
  id: string;
  name: string;
  category: string;
  size: string;
  date: string;
  format?: string;
  sizeBytes?: number;
  updatedAt?: string;
  version?: string;
  type?: string;
  url?: string;
  uploadedBy?: string;
  description?: string;
}

export const DEFAULT_TEMPLATE_DOCUMENTS: TemplateDocumentItem[] = [
  {
    id: "doc-1",
    name: "BOQ v7 Final — Kohinoor L4.pdf",
    category: "BOQ",
    size: "2.4 MB",
    sizeBytes: 2516582,
    date: "5 Aug 2024",
    format: "PDF",
    version: "v7.0",
    type: "BOQ",
    uploadedBy: "Admin User",
    description: "Finalized Bill of Quantities breakdown for Kohinoor Level 4 interior package.",
  },
  {
    id: "doc-2",
    name: "Floor Plan — Level 4.dwg",
    category: "Drawing",
    size: "18.7 MB",
    sizeBytes: 19608371,
    date: "2 Aug 2024",
    format: "DWG",
    version: "v4.2",
    type: "Drawing",
    uploadedBy: "Chief Architect",
    description: "Detailed AutoCAD architectural floor plan with room dimensions and civil partitions.",
  },
  {
    id: "doc-3",
    name: "Material Cost Matrix Aug 2024.xlsx",
    category: "Costing",
    size: "890 KB",
    sizeBytes: 911360,
    date: "28 Jul 2024",
    format: "XLSX",
    version: "v2.1",
    type: "Costing",
    uploadedBy: "Procurement Lead",
    description: "Unit economics, current market rates, vendor discounts, and tax percentages.",
  },
  {
    id: "doc-4",
    name: "Client Proposal FINAL.pdf",
    category: "Proposal",
    size: "1.8 MB",
    sizeBytes: 1887436,
    date: "22 Jul 2024",
    format: "PDF",
    version: "v3.0",
    type: "Proposal",
    uploadedBy: "Project Director",
    description: "Client-facing pitch deck with scopes of work, milestones, commercial summary, and T&Cs.",
  },
  {
    id: "doc-5",
    name: "Vendor Quotes — Stone World.xlsx",
    category: "Vendor",
    size: "420 KB",
    sizeBytes: 430080,
    date: "1 Aug 2024",
    format: "XLSX",
    version: "v1.1",
    type: "Vendor",
    uploadedBy: "Procurement Lead",
    description: "Itemized quotations for Italian marble, granite slabs, and quartz surfaces.",
  },
  {
    id: "doc-6",
    name: "Site Progress Photos — Aug.jpg",
    category: "Site",
    size: "24 MB",
    sizeBytes: 25165824,
    date: "1 Aug 2024",
    format: "JPG",
    version: "v1.0",
    type: "Site",
    uploadedBy: "Site Supervisor",
    description: "High-resolution pre-construction photographic survey and site condition audit.",
  },
];

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function detectCategoryAndFormat(fileName: string): { category: string; format: string } {
  const ext = fileName.split(".").pop()?.toUpperCase() || "PDF";
  let category = "General";

  const lower = fileName.toLowerCase();
  if (lower.includes("boq")) category = "BOQ";
  else if (lower.includes("drawing") || lower.includes("plan") || ext === "DWG") category = "Drawing";
  else if (lower.includes("cost") || lower.includes("rate") || lower.includes("price")) category = "Costing";
  else if (lower.includes("proposal") || lower.includes("pitch")) category = "Proposal";
  else if (lower.includes("quote") || lower.includes("vendor")) category = "Vendor";
  else if (lower.includes("photo") || lower.includes("site") || lower.includes("progress")) category = "Site";
  else if (lower.includes("contract") || lower.includes("agreement")) category = "Contract";
  else if (lower.includes("spec") || lower.includes("specification")) category = "Specification";

  return { category, format: ext };
}

export function normalizeTemplateDocument(raw: any, index = 0): TemplateDocumentItem {
  if (!raw || typeof raw !== "object") {
    return {
      id: `doc-${index + 1}`,
      name: `Document ${index + 1}`,
      category: "General",
      size: "1.2 MB",
      date: "12 Aug 2024",
      format: "PDF",
    };
  }

  const name = raw.name || raw.title || `Document ${index + 1}`;
  const detected = detectCategoryAndFormat(name);

  return {
    id: String(raw.id || `doc-${index + 1}`),
    name,
    category: raw.category || raw.type || detected.category,
    size: raw.size || (raw.sizeBytes ? formatFileSize(raw.sizeBytes) : "1.2 MB"),
    date: raw.date || (raw.updatedAt ? formatDateString(raw.updatedAt) : "5 Aug 2024"),
    format: raw.format || detected.format,
    sizeBytes: raw.sizeBytes,
    updatedAt: raw.updatedAt,
    version: raw.version || "v1.0",
    type: raw.type || raw.category || detected.category,
    url: raw.url,
    uploadedBy: raw.uploadedBy || "Admin User",
    description: raw.description,
  };
}

export function formatDateString(isoOrStr: string): string {
  try {
    const d = new Date(isoOrStr);
    if (isNaN(d.getTime())) return String(isoOrStr);
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return String(isoOrStr);
  }
}
