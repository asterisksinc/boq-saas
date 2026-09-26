"use client";

import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { IntegrationProvider, IntegrationFlowStep, CustomFormField } from '@/lib/integrations/types';
import { integrationsApi } from '@/lib/api/integrations';
import WebhookSetupStep from './WebhookSetupStep';
import FormDetailsStep from './FormDetailsStep';
import IntegrationSuccessStep from './IntegrationSuccessStep';

interface Props {
    provider: IntegrationProvider;
    onClose: (success?: boolean) => void;
}

export default function IntegrationModal({ provider, onClose }: Props) {
    const [step, setStep] = useState<IntegrationFlowStep>('webhook_setup');
    const [integrationId, setIntegrationId] = useState<string | null>(null);
    const [webhookUrl, setWebhookUrl] = useState('');
    
    // Success step data
    const [formUrl, setFormUrl] = useState('');
    const [embedHtml, setEmbedHtml] = useState('');
    const [formId, setFormId] = useState('');

    const [formName, setFormName] = useState('');
    const [fields, setFields] = useState<CustomFormField[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    /* 1 — On mount, connect the integration */
    useEffect(() => {
        (async () => {
            try {
                const intg = await integrationsApi.connect({ provider });
                setIntegrationId(intg.id);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to connect integration');
            }
        })();
    }, [provider]);

    /* 2 — Escape key handler */
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    /* 3 — Save form (transition from form_details → success) */
    const handleSaveForm = useCallback(async () => {
        if (!integrationId || !formName.trim()) return;
        setSaving(true);
        setError('');
        try {
            const form = await integrationsApi.createForm({
                integrationId,
                name: formName.trim(),
                fields: fields.map((f, i) => ({
                    name: f.name,
                    fieldType: f.type,
                    required: f.required,
                    position: i,
                    config: f.config,
                })),
            });
            const token = form.publicToken;
            
            setFormId(form.id);
            setFormUrl(`${window.location.origin}/form/${token}`);
            setEmbedHtml(`<iframe src="${window.location.origin}/form/${token}" width="100%" height="600" frameborder="0" loading="lazy"></iframe>`);
            
            setStep('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create form');
        } finally {
            setSaving(false);
        }
    }, [integrationId, formName, fields]);

    const handleNext = () => {
        if (step === 'webhook_setup') setStep('form_details');
        else if (step === 'form_details') handleSaveForm();
    };

    const handleBack = () => {
        if (step === 'form_details') setStep('webhook_setup');
    };

    const renderStep = () => {
        switch (step) {
            case 'webhook_setup':
                return <WebhookSetupStep webhookUrl={webhookUrl} onNext={handleNext} onCancel={() => onClose()} />;
            case 'form_details':
                return (
                    <FormDetailsStep
                        formName={formName}
                        setFormName={setFormName}
                        fields={fields}
                        setFields={setFields}
                        onNext={handleNext}
                        onBack={handleBack}
                        onCancel={() => onClose()}
                        saving={saving}
                    />
                );
            case 'success':
                return <IntegrationSuccessStep formUrl={formUrl} embedHtml={embedHtml} formId={formId} integrationId={integrationId!} onClose={() => onClose(true)} />;
            default:
                return null;
        }
    };

    return (
        <div className="intg-modal-backdrop" onClick={() => onClose()}>
            <div className="intg-modal-dialog" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
                <button className="intg-modal-close" onClick={() => onClose()} aria-label="Close">
                    <X size={18} />
                </button>
                {error && <div className="intg-modal-error">{error}</div>}
                {renderStep()}
            </div>
        </div>
    );
}
