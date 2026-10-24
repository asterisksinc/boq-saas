"use client";

import { useState } from 'react';
import { Copy, Check, X } from 'lucide-react';

interface Props {
    webhookUrl?: string;
    onNext: () => void;
    onCancel: () => void;
    onClose?: () => void;
}

const DEFAULT_WEBHOOK_URL = "https://app.boqsaas.com/webhooks/custom-website/abc123";

export default function WebhookSetupStep({ webhookUrl = DEFAULT_WEBHOOK_URL, onNext, onCancel, onClose }: Props) {
    const [copied, setCopied] = useState(false);
    const displayUrl = webhookUrl || DEFAULT_WEBHOOK_URL;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(displayUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="intg-custom-step-container">
            {/* Header: Frame 2147225093 */}
            <div className="intg-custom-modal-header">
                <div className="intg-custom-modal-title-group">
                    <h2 className="intg-custom-modal-title">Webhook Setup</h2>
                    <p className="intg-custom-modal-subtitle">Send POST requests to the following URL</p>
                </div>
                <button 
                    type="button" 
                    className="intg-custom-modal-close" 
                    onClick={onClose || onCancel} 
                    aria-label="Close"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Inner White Card: Frame 2147225027 */}
            <div className="intg-custom-modal-card">
                {/* Input Field: Webhook URL */}
                <div className="intg-custom-form-group">
                    <label className="intg-custom-label">
                        Webhook URL <span className="intg-custom-required">*</span>
                    </label>
                    <div className="intg-custom-input-box intg-webhook-input-box">
                        <span className="intg-webhook-url-text" title={displayUrl}>
                            {displayUrl}
                        </span>
                        <button 
                            type="button" 
                            className="intg-webhook-copy-btn" 
                            onClick={handleCopy}
                            aria-label={copied ? "Copied" : "Copy webhook URL"}
                            title={copied ? "Copied!" : "Copy URL"}
                        >
                            {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                        </button>
                    </div>
                </div>

                {/* Helper Card: Frame 12 - How it works? */}
                <div className="intg-how-it-works-box">
                    <h4 className="intg-how-it-works-title">How it works?</h4>
                    <p className="intg-how-it-works-text">
                        1. Copy the Webhook URL above. 2. Add this URL to your website&apos;s form settings or backend. 3. Send a POST request with lead data when a form is submitted.
                    </p>
                </div>
            </div>

            {/* Footer Actions: Frame 2147225069 */}
            <div className="intg-custom-modal-footer intg-custom-footer-webhook">
                <button 
                    type="button" 
                    className="intg-custom-btn intg-custom-btn-cancel" 
                    onClick={onCancel}
                >
                    Cancel
                </button>
                <button 
                    type="button" 
                    className="intg-custom-btn intg-custom-btn-primary" 
                    onClick={onNext}
                >
                    Next
                </button>
            </div>
        </div>
    );
}
