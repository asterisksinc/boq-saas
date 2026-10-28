"use client";

import React from "react";
import { ChevronRight } from "lucide-react";

export interface HelpSupportCtaProps {
    onRaiseTicket: () => void;
    tag?: string;
    title?: string;
    description?: string;
    buttonText?: string;
    className?: string;
}

export function HelpSupportCta({
    onRaiseTicket,
    tag = "NEED A HUMAN?",
    title = "Can't find what you need?",
    description = "Our team will review your issue and respond according to your support plan.",
    buttonText = "Raise a Support Ticket",
    className = "",
}: HelpSupportCtaProps) {
    return (
        <div className={`help-support-cta ${className}`.trim()}>
            <div className="cta-watermark">?</div>
            <div className="cta-content">
                <span className="cta-tag">{tag}</span>
                <h3>{title}</h3>
                <p>{description}</p>
            </div>
            <button
                type="button"
                className="btn-cta-raise"
                onClick={onRaiseTicket}
            >
                <span>{buttonText}</span>
                <ChevronRight size={18} />
            </button>
        </div>
    );
}

export default HelpSupportCta;
