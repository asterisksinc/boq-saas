"use client";

import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { integrationsApi, IntegrationForm, UpdateFormInput } from '@/lib/api/integrations';
import type { FormFieldType } from '@/lib/integrations/types';

interface Props {
    formId: string;
    onClose: (updated?: boolean) => void;
}

const FIELD_TYPES: FormFieldType[] = ['short_answer', 'long_answer', 'dropdown', 'checkbox', 'link'];

type EditableField = {
    id?: string;
    name: string;
    fieldType: FormFieldType;
    required: boolean;
    position: number;
    config: Record<string, unknown>;
};

export default function FormEditModal({ formId, onClose }: Props) {
    const [form, setForm] = useState<IntegrationForm | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [name, setName] = useState('');
    const [campaignId, setCampaignId] = useState('');
    const [campaignName, setCampaignName] = useState('');
    const [fields, setFields] = useState<EditableField[]>([]);

    const loadForm = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await integrationsApi.getForm(formId);
            setForm(data);
            setName(data.name);
            setCampaignId(data.campaignId ?? '');
            setCampaignName(data.campaignName ?? '');
            setFields((data.fields ?? []).map((f, i) => ({
                id: f.id,
                name: f.name ?? (f as Record<string, unknown>).name as string ?? '',
                fieldType: (f.fieldType ?? (f as Record<string, unknown>).fieldType ?? 'short_answer') as FormFieldType,
                required: f.required ?? false,
                position: f.position ?? i,
                config: f.config ?? {},
            })));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load form');
        } finally {
            setLoading(false);
        }
    }, [formId]);

    useEffect(() => { loadForm(); }, [loadForm]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    const handleSave = async () => {
        if (!name.trim()) { setError('Form name is required'); return; }
        setSaving(true);
        setError('');
        try {
            const input: UpdateFormInput = {
                name: name.trim(),
                campaignId: campaignId.trim() || null,
                campaignName: campaignName.trim() || null,
                fields: fields.map((f, i) => ({
                    id: f.id,
                    name: f.name,
                    fieldType: f.fieldType,
                    required: f.required,
                    position: i,
                    config: f.config,
                })),
            };
            await integrationsApi.updateForm(formId, input);
            onClose(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save form');
        } finally {
            setSaving(false);
        }
    };

    const addField = () => {
        setFields(prev => [...prev, {
            name: '',
            fieldType: 'short_answer' as FormFieldType,
            required: false,
            position: prev.length,
            config: {},
        }]);
    };

    const removeField = (index: number) => {
        setFields(prev => prev.filter((_, i) => i !== index));
    };

    const updateField = (index: number, updates: Partial<EditableField>) => {
        setFields(prev => prev.map((f, i) => i === index ? { ...f, ...updates } : f));
    };

    return (
        <div className="intg-modal-backdrop" onClick={() => onClose()}>
            <div className="intg-modal-dialog" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
                <button className="intg-modal-close" onClick={() => onClose()} aria-label="Close">
                    <X size={18} />
                </button>

                {error && <div className="intg-modal-error">{error}</div>}

                {loading ? (
                    <div className="intg-modal-content" style={{ padding: '40px', textAlign: 'center' }}>Loading form...</div>
                ) : (
                    <div className="intg-modal-content">
                        <h2>Edit Form</h2>
                        <p className="intg-modal-subtitle">Update form settings and fields.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '14px', fontWeight: 500 }}>
                                Form Name *
                                <input
                                    className="intg-input"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Form name"
                                />
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '14px', fontWeight: 500 }}>
                                    Campaign ID
                                    <input
                                        className="intg-input"
                                        value={campaignId}
                                        onChange={e => setCampaignId(e.target.value)}
                                        placeholder="Optional"
                                    />
                                </label>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '14px', fontWeight: 500 }}>
                                    Campaign Name
                                    <input
                                        className="intg-input"
                                        value={campaignName}
                                        onChange={e => setCampaignName(e.target.value)}
                                        placeholder="Optional"
                                    />
                                </label>
                            </div>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Fields ({fields.length})</h3>
                                <button className="intg-btn intg-btn-outline" onClick={addField} style={{ fontSize: '13px', padding: '4px 12px' }}>
                                    <Plus size={14} /> Add Field
                                </button>
                            </div>

                            {fields.length === 0 && (
                                <div className="intg-empty-state" style={{ padding: '20px' }}>No fields. Add at least one field.</div>
                            )}

                            {fields.map((field, index) => (
                                <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto auto', gap: '8px', alignItems: 'center', marginBottom: '8px', padding: '8px', background: '#f9fafb', borderRadius: '6px' }}>
                                    <input
                                        className="intg-input"
                                        value={field.name}
                                        onChange={e => updateField(index, { name: e.target.value })}
                                        placeholder="Field name"
                                        style={{ fontSize: '13px' }}
                                    />
                                    <select
                                        className="intg-input"
                                        value={field.fieldType}
                                        onChange={e => updateField(index, { fieldType: e.target.value as FormFieldType })}
                                        style={{ fontSize: '13px' }}
                                    >
                                        {FIELD_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                                    </select>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', whiteSpace: 'nowrap' }}>
                                        <input type="checkbox" checked={field.required} onChange={e => updateField(index, { required: e.target.checked })} />
                                        Req
                                    </label>
                                    <button onClick={() => removeField(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '4px' }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="intg-modal-actions">
                            <button className="intg-btn intg-btn-modal-cancel" onClick={() => onClose()}>Cancel</button>
                            <button className="intg-btn intg-btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
