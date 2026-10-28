"use client";

import React from "react";
import {
    Sparkles,
    LayoutDashboard,
    FileSpreadsheet,
    Receipt,
    FolderOpen,
    Link2,
    Users,
    CreditCard,
    HelpCircle,
} from "lucide-react";

export function getCategoryIcon(slug: string, size = 20) {
    const s = slug.toLowerCase();
    if (s.includes("getting-started") || s.includes("start")) return <Sparkles size={size} />;
    if (s.includes("project") || s.includes("activit")) return <LayoutDashboard size={size} />;
    if (s.includes("boq") || s.includes("cost")) return <FileSpreadsheet size={size} />;
    if (s.includes("proposal") || s.includes("invoice")) return <Receipt size={size} />;
    if (s.includes("doc")) return <FolderOpen size={size} />;
    if (s.includes("integration")) return <Link2 size={size} />;
    if (s.includes("team") || s.includes("permission")) return <Users size={size} />;
    if (s.includes("bill") || s.includes("account")) return <CreditCard size={size} />;
    return <HelpCircle size={size} />;
}
