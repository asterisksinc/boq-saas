"use client";

import React from "react";

export interface ArticleContentRendererProps {
    content?: any;
    summary?: string | null;
}

export function ArticleContentRenderer({ content, summary }: ArticleContentRendererProps) {
    if (!content) {
        return <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.6", margin: 0 }}>{summary || "No article content available."}</p>;
    }

    // JSON structured format: { shortAnswer, sections: [{ heading, body, items }] }
    if (typeof content === "object") {
        if (Array.isArray(content.sections) && content.sections.length > 0) {
            return (
                <div className="article-sections-flow">
                    {content.sections.map((section: any, idx: number) => (
                        <div key={idx} className="article-section-block">
                            {section.heading && <h3>{section.heading}</h3>}
                            {section.body && <p>{section.body}</p>}
                            {Array.isArray(section.items) && (
                                <ol className="article-ordered-steps">
                                    {section.items.map((item: string, iIdx: number) => (
                                        <li key={iIdx}>{item}</li>
                                    ))}
                                </ol>
                            )}
                        </div>
                    ))}
                </div>
            );
        }

        if (content.body) {
            return <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.6", whiteSpace: "pre-wrap", margin: 0 }}>{content.body}</p>;
        }
    }

    // String format (HTML or plain text)
    if (typeof content === "string") {
        if (content.includes("<") && content.includes(">")) {
            return <div className="article-sections-flow" dangerouslySetInnerHTML={{ __html: content }} />;
        }
        return <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.6", whiteSpace: "pre-wrap", margin: 0 }}>{content}</p>;
    }

    return <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.6", margin: 0 }}>{summary || "No article content available."}</p>;
}

export default ArticleContentRenderer;
