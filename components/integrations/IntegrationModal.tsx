"use client";

import { useState, useEffect, useCallback } from 'react';
import { IntegrationProvider, IntegrationFlowStep, CustomFormField } from '@/lib/integrations/types';
import { integrationsApi } from '@/lib/api/integrations';
import WebhookSetupStep from './WebhookSetupStep';
import FormDetailsStep from './FormDetailsStep';
import IntegrationSuccessStep from './IntegrationSuccessStep';
import ProviderConnectDialog from './ProviderConnectDialog';

interface Props {
    provider: IntegrationProvider;
    onClose: (success?: boolean) => void;
}

const DEFAULT_INITIAL_FIELDS: CustomFormField[] = [
    {
        id: 'default_field_1',
        name: 'Full Name',
        type: 'short_answer',
        required: true,
        position: 0,
        config: {},
    },
    {
        id: 'default_field_2',
        name: 'Email Address',
        type: 'short_answer',
        required: true,
        position: 1,
        config: {},
    },
    {
        id: 'default_field_3',
        name: 'Interested in',
        type: 'dropdown',
        required: false,
        position: 2,
        config: {
            options: ['Residential Construction', 'Commercial BOQ', 'Interior Estimation'],
        },
    },
    {
        id: 'default_field_4',
        name: 'Subscribe to Newsletter',
        type: 'checkbox',
        required: false,
        position: 3,
        config: {},
    },
];

export default function IntegrationModal({ provider, onClose }: Props) {
    const isCustomWebsite = provider === 'custom_website';

    const [step, setStep] = useState<IntegrationFlowStep>('webhook_setup');
    const [integrationId, setIntegrationId] = useState<string | null>(null);
    const [webhookUrl, setWebhookUrl] = useState('https://app.boqsaas.com/webhooks/custom-website/abc123');
    
    // Success step data
    const [formUrl, setFormUrl] = useState('');
    const [embedHtml, setEmbedHtml] = useState('');
    const [formId, setFormId] = useState('');

    const [formName, setFormName] = useState('');
    const [fields, setFields] = useState<CustomFormField[]>(DEFAULT_INITIAL_FIELDS);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    /* For custom_website on mount, ensure integration is connected */
    useEffect(() => {
        if (!isCustomWebsite) return;
        (async () => {
            try {
                const intg = await integrationsApi.connect({ provider });
                setIntegrationId(intg.id);
                setWebhookUrl(`https://app.boqsaas.com/webhooks/custom-website/${intg.id}`);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to connect integration');
            }
        })();
    }, [isCustomWebsite, provider]);

    /* Escape key handler */
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    /* Handle direct provider connect (for non-custom_website) */
    const handleProviderConnect = async (config: Record<string, unknown>) => {
        setSaving(true);
        setError('');
        try {
            await integrationsApi.connect({ provider, config });
            onClose(true);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to connect integration';
            setError(msg);
            throw err;
        } finally {
            setSaving(false);
        }
    };

    /* Save custom_website form (transition from form_details → success) */
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
            const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.boqsaas.com';
            
            setFormId(form.id);
            setFormUrl(`${origin}/form/${token}`);
            setEmbedHtml(`<iframe src="${origin}/form/${token}" width="100%" height="600" frameborder="0" loading="lazy"></iframe>`);
            
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

    if (!isCustomWebsite) {
        return (
            <ProviderConnectDialog
                provider={provider}
                loading={saving}
                onConnect={handleProviderConnect}
                onCancel={() => onClose(false)}
            />
        );
    }

    const renderStep = () => {
        switch (step) {
            case 'webhook_setup':
                return (
                    <WebhookSetupStep 
                        webhookUrl={webhookUrl} 
                        onNext={handleNext} 
                        onCancel={() => onClose()} 
                        onClose={() => onClose()} 
                    />
                );
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
                        onClose={() => onClose()}
                        saving={saving}
                    />
                );
            case 'success':
                return (
                    <IntegrationSuccessStep 
                        formUrl={formUrl} 
                        embedHtml={embedHtml} 
                        formId={formId} 
                        integrationId={integrationId || 'cweb'} 
                        onClose={() => onClose(true)} 
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="intg-modal-backdrop" onClick={() => onClose()} role="presentation">
            <div 
                className="intg-custom-website-modal" 
                role="dialog" 
                aria-modal="true" 
                onClick={e => e.stopPropagation()}
            >
                {error && <div className="intg-custom-modal-error" role="alert">{error}</div>}
                {renderStep()}
            </div>
        </div>
    );
}
