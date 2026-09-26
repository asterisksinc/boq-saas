"use client";

interface Props {
    webhookUrl: string;
    onNext: () => void;
    onCancel: () => void;
}

export default function WebhookSetupStep({ onNext, onCancel }: Props) {
    return (
        <div className="intg-modal-content">
            <h2>Setup Webhook</h2>
            <p className="intg-modal-subtitle">Configure your custom form to send leads to BOQ.</p>
            
            <div className="intg-webhook-box" style={{ padding: '20px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', marginBottom: '24px' }}>
                <p>The webhook URL will be generated when you create a form in the next step.</p>
            </div>

            <div className="intg-info-panel">
                <h4>How it works?</h4>
                <p>1. Complete the form setup in the next step.<br/>2. Copy the generated webhook URL.<br/>3. Paste it in your website's form action and send POST requests.</p>
            </div>

            <div className="intg-modal-actions">
                <button className="intg-btn intg-btn-modal-cancel" onClick={onCancel}>Cancel</button>
                <button className="intg-btn intg-btn-primary" onClick={onNext}>Next Step</button>
            </div>
        </div>
    );
}
