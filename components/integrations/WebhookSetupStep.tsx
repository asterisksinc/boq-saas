"use client";

import { Copy } from 'lucide-react';
import { useState } from 'react';

interface Props {
    webhookUrl: string;
    onNext: () => void;
    onCancel: () => void;
}

export default function WebhookSetupStep({ webhookUrl, onNext, onCancel }: Props) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(webhookUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="intg-modal-content">
            <h2>Setup Webhook</h2>
            <p className="intg-modal-subtitle">Copy this URL to your custom website to send leads to BOQ.</p>
            
            <div className="intg-webhook-box">
                <label>Webhook URL</label>
                <div className="intg-input-group">
                    <input type="text" readOnly value={webhookUrl} className="intg-input" />
                    <button className="intg-btn intg-btn-secondary" onClick={handleCopy}>
                        <Copy size={16} /> {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
            </div>

            <div className="intg-info-panel">
                <h4>How it works?</h4>
                <p>1. Copy the webhook URL above.<br/>2. Paste it in your website's form action or webhook settings.<br/>3. Send POST requests with form data.</p>
            </div>

            <div className="intg-modal-actions">
                <button className="intg-btn intg-btn-modal-cancel" onClick={onCancel}>Cancel</button>
                <button className="intg-btn intg-btn-primary" onClick={onNext}>Next Step</button>
            </div>
        </div>
    );
}
