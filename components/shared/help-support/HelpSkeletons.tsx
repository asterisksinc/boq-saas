"use client";

import React from "react";

export function HelpSkeleton() {
    return (
        <div className="popular-articles-grid">
            {[1, 2, 3, 4].map((i) => (
                <div
                    key={i}
                    style={{
                        background: "#FFFFFF",
                        borderRadius: "14px",
                        boxShadow: "0px 0px 6px rgba(0, 0, 0, 0.06)",
                        padding: "16px",
                        minHeight: "167px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        gap: "16px",
                    }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "6px", background: "#E4ECFB" }} />
                        <div style={{ width: "60px", height: "14px", borderRadius: "4px", background: "#F1F5F9" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div style={{ height: "16px", width: "70%", borderRadius: "4px", background: "#F1F5F9" }} />
                        <div style={{ height: "12px", width: "95%", borderRadius: "4px", background: "#F8FAFC" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ height: "12px", width: "35%", borderRadius: "4px", background: "#F1F5F9" }} />
                        <div style={{ height: "12px", width: "25%", borderRadius: "4px", background: "#F1F5F9" }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function CategorySkeleton() {
    return (
        <div className="product-categories-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                    key={i}
                    style={{
                        background: "#FFFFFF",
                        borderRadius: "14px",
                        boxShadow: "0px 0px 6px rgba(0, 0, 0, 0.06)",
                        padding: "16px",
                        minHeight: "111px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "16px",
                    }}
                >
                    <div style={{ width: "40px", height: "40px", borderRadius: "6px", background: "#E4ECFB", flexShrink: 0 }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                        <div style={{ height: "16px", width: "55%", borderRadius: "4px", background: "#F1F5F9" }} />
                        <div style={{ height: "12px", width: "85%", borderRadius: "4px", background: "#F8FAFC" }} />
                        <div style={{ height: "12px", width: "30%", marginTop: "4px", borderRadius: "4px", background: "#E4ECFB" }} />
                    </div>
                </div>
            ))}
        </div>
    );
}
