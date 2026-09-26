"use client";

import { CheckCircle2, Copy } from 'lucide-react';
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

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(formUrl);
    };

    const handleCopyEmbed = () => {
        navigator.clipboard.writeText(embedHtml);
    };

    const handleViewLeads = () => {
        router.push(`/integrations/${integrationId}/forms/${formId}`);
        onClose();
    };

    return (
        <div className="intg-modal-content intg-success-content">
            <CheckCircle2 size={56} className="intg-success-icon" />
            <h2>Your form is ready!</h2>
            <p className="intg-success-subtitle">Your form has been created successfully.</p>
            
            <div className="intg-share-section">
                <h4>Share Form Link</h4>
                <p>Copy and share this link to collect responses through your form</p>
                <div className="intg-copy-field">
                    <input readOnly value={formUrl} />
                    <button onClick={handleCopyUrl}><Copy size={16} /></button>
                </div>
            </div>
            
            <div className="intg-share-section">
                <h4>Embed Form to Website</h4>
                <p>Copy and paste this code into your website's HTML</p>
                <div className="intg-copy-field">
                    <input readOnly value={embedHtml} />
                    <button onClick={handleCopyEmbed}><Copy size={16} /></button>
                </div>
            </div>
            
            <div className="intg-modal-footer">
                <button className="intg-btn intg-btn-outline" onClick={handleViewLeads}>View Leads</button>
                <button className="intg-btn intg-btn-primary" onClick={onClose}>Done</button>
            </div>
        </div>
    );
}
