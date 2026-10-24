"use client";

import { CheckCircle2, Copy, Check, X } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
    formUrl: string;
    embedHtml: string;
    formId: string;
    integrationId: string;
    onClose: () => void;
}

export default function IntegrationSuccessStep({ formUrl, embedHtml, formId, integrationId, onClose }: Props) {
    const router = useRouter();
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [copiedEmbed, setCopiedEmbed] = useState(false);

    const handleCopyUrl = async () => {
        try {
            await navigator.clipboard.writeText(formUrl);
            setCopiedUrl(true);
            setTimeout(() => setCopiedUrl(false), 2000);
        } catch {
            setCopiedUrl(true);
            setTimeout(() => setCopiedUrl(false), 2000);
        }
    };

    const handleCopyEmbed = async () => {
        try {
            await navigator.clipboard.writeText(embedHtml);
            setCopiedEmbed(true);
            setTimeout(() => setCopiedEmbed(false), 2000);
        } catch {
            setCopiedEmbed(true);
            setTimeout(() => setCopiedEmbed(false), 2000);
        }
    };

    const handleViewLeads = () => {
        router.push(`/integrations/${integrationId}/forms/${formId}`);
        onClose();
    };

    return (
        <div className="intg-custom-step-container">
            {/* Header */}
            <div className="intg-custom-modal-header">
                <div className="intg-custom-modal-title-group">
                    <h2 className="intg-custom-modal-title">Form Ready</h2>
                    <p className="intg-custom-modal-subtitle">Your form has been created successfully</p>
                </div>
                <button 
                    type="button" 
                    className="intg-custom-modal-close" 
                    onClick={onClose} 
                    aria-label="Close"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Inner White Card */}
            <div className="intg-custom-modal-card">
                <div className="intg-success-banner">
                    <CheckCircle2 size={40} className="intg-success-icon" />
                    <h3 className="intg-success-title">Integration Complete!</h3>
                    <p className="intg-success-desc">
                        You can now share this form URL or embed it directly into your website.
                    </p>
                </div>

                {/* Share Form Link */}
                <div className="intg-custom-form-group">
                    <label className="intg-custom-label">Share Form Link</label>
                    <div className="intg-custom-input-box intg-webhook-input-box">
                        <span className="intg-webhook-url-text" title={formUrl}>{formUrl}</span>
                        <button 
                            type="button" 
                            className="intg-webhook-copy-btn" 
                            onClick={handleCopyUrl}
                            aria-label={copiedUrl ? "Copied" : "Copy form URL"}
                        >
                            {copiedUrl ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                        </button>
                    </div>
                </div>

                {/* Embed Form */}
                <div className="intg-custom-form-group">
                    <label className="intg-custom-label">Embed Form Code</label>
                    <div className="intg-custom-input-box intg-webhook-input-box">
                        <span className="intg-webhook-url-text" title={embedHtml}>{embedHtml}</span>
                        <button 
                            type="button" 
                            className="intg-webhook-copy-btn" 
                            onClick={handleCopyEmbed}
                            aria-label={copiedEmbed ? "Copied" : "Copy embed code"}
                        >
                            {copiedEmbed ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="intg-custom-modal-footer intg-custom-footer-form-details">
                <button 
                    type="button" 
                    className="intg-custom-btn intg-custom-btn-back" 
                    onClick={handleViewLeads}
                >
                    View Leads
                </button>
                <div className="intg-custom-footer-right-group">
                    <button 
                        type="button" 
                        className="intg-custom-btn intg-custom-btn-primary" 
                        onClick={onClose}
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
