"use client";

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { CustomFormField, FormFieldType } from '@/lib/integrations/types';

interface Props {
    initialData: CustomFormField | null;
    onSave: (field: CustomFormField) => void;
    onCancel: () => void;
}

const fieldTypeOptions: { value: FormFieldType; label: string }[] = [
    { value: 'short_answer', label: 'Short Answer' },
    { value: 'long_answer', label: 'Long Answer' },
    { value: 'dropdown', label: 'Drop Down' },
    { value: 'checkbox', label: 'Check Box' },
    { value: 'link', label: 'Link' },
];

export default function FieldEditor({ initialData, onSave, onCancel }: Props) {
    const [name, setName] = useState(initialData?.name || '');
    const [type, setType] = useState<FormFieldType>(initialData?.type || 'short_answer');
    const [required, setRequired] = useState(initialData?.required ?? false);
    const [dropdownOptions, setDropdownOptions] = useState<string[]>(
        (initialData?.config?.options as string[]) || ['']
    );

    // Validation
    const nameValid = name.trim().length > 0;
    
    // Check for dropdown validity
    const optionsClean = dropdownOptions.map(o => o.trim());
    const hasEmptyOptions = optionsClean.some(o => o === '');
    const hasDuplicateOptions = new Set(optionsClean).size !== optionsClean.length;
    const hasEnoughOptions = optionsClean.length > 0;
    const dropdownValid = type !== 'dropdown' || (!hasEmptyOptions && !hasDuplicateOptions && hasEnoughOptions);

    const isValid = nameValid && dropdownValid;

    const handleTypeChange = (newType: FormFieldType) => {
        setType(newType);
        if (newType !== 'dropdown') {
            setDropdownOptions(['']);
        }
    };

    const handleSave = () => {
        if (!isValid) return;

        const config: Record<string, unknown> = {};
        if (type === 'dropdown') {
            config.options = dropdownOptions.map(o => o.trim());
        }
        onSave({
            id: initialData?.id || Math.random().toString(36).substring(2, 11),
            name: name.trim(),
            type,
            required,
            position: initialData?.position || 0,
            config,
        });
    };

    return (
        <div className="intg-inline-editor">
            <div className="intg-form-group">
                <label>Field Name <span className="text-red">*</span></label>
                <input 
                    type="text" 
                    className="intg-input" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Full Name"
                />
                {!nameValid && name.length > 0 && <span className="intg-error-text">Field name is required</span>}
            </div>

            <div className="intg-form-group">
                <label>Field Type <span className="text-red">*</span></label>
                <select className="intg-input" value={type} onChange={e => handleTypeChange(e.target.value as FormFieldType)}>
                    {fieldTypeOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>

            {type === 'dropdown' && (
                <div className="intg-form-group">
                    <label>Fields</label>
                    <div className="intg-dropdown-options">
                        {dropdownOptions.map((opt, i) => (
                            <div key={i} className="intg-dropdown-option-row">
                                <input
                                    type="text"
                                    className="intg-input"
                                    value={opt}
                                    onChange={e => {
                                        const updated = [...dropdownOptions];
                                        updated[i] = e.target.value;
                                        setDropdownOptions(updated);
                                    }}
                                    placeholder={`Option ${i + 1}`}
                                />
                                <button
                                    className="intg-field-action-btn intg-field-action-delete"
                                    onClick={() => setDropdownOptions(dropdownOptions.filter((_, idx) => idx !== i))}
                                    aria-label="Remove option"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        
                        {type === 'dropdown' && hasEmptyOptions && dropdownOptions.length > 0 && (
                            <div className="intg-error-text">Options cannot be empty</div>
                        )}
                        {type === 'dropdown' && hasDuplicateOptions && (
                            <div className="intg-error-text">Options must be unique</div>
                        )}
                        {type === 'dropdown' && !hasEnoughOptions && (
                            <div className="intg-error-text">At least 1 option is required</div>
                        )}

                        <button
                            type="button"
                            className="intg-add-option-btn"
                            onClick={() => setDropdownOptions([...dropdownOptions, ''])}
                        >
                            + Add Option
                        </button>
                    </div>
                </div>
            )}

            <div className="intg-form-group-checkbox">
                <input 
                    type="checkbox" 
                    id="req-field" 
                    checked={required} 
                    onChange={e => setRequired(e.target.checked)} 
                />
                <label htmlFor="req-field">Required Field</label>
            </div>

            <div className="intg-inline-editor-actions">
                <button className="intg-btn intg-btn-modal-cancel" onClick={onCancel}>Cancel</button>
                <button className="intg-btn intg-btn-primary" onClick={handleSave} disabled={!isValid}>
                    {initialData ? 'Save Changes' : 'Add Field'}
                </button>
            </div>
        </div>
    );
}
