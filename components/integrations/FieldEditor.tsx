"use client";

import { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { CustomFormField, FormFieldType } from '@/lib/integrations/types';

interface Props {
    initialData: CustomFormField | null;
    onSave: (field: CustomFormField) => void;
    onCancel: () => void;
}

const FIELD_TYPE_OPTIONS: { value: FormFieldType; label: string }[] = [
    { value: 'short_answer', label: 'Short Answer' },
    { value: 'long_answer', label: 'Long Answer' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'link', label: 'Link' },
];

export default function FieldEditor({ initialData, onSave, onCancel }: Props) {
    const [name, setName] = useState(initialData?.name || '');
    const [type, setType] = useState<FormFieldType>(initialData?.type || 'short_answer');
    const [required, setRequired] = useState(initialData?.required ?? false);
    const [dropdownOptions, setDropdownOptions] = useState<string[]>(
        Array.isArray(initialData?.config?.options) && (initialData.config.options as string[]).length > 0
            ? (initialData.config.options as string[])
            : ['']
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
        if (newType === 'dropdown' && dropdownOptions.length === 0) {
            setDropdownOptions(['Option 1', 'Option 2']);
        }
    };

    const handleAddOption = () => {
        setDropdownOptions(prev => [...prev, `Option ${prev.length + 1}`]);
    };

    const handleUpdateOption = (index: number, val: string) => {
        setDropdownOptions(prev => prev.map((opt, i) => i === index ? val : opt));
    };

    const handleRemoveOption = (index: number) => {
        setDropdownOptions(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        if (!isValid) return;

        const config: Record<string, unknown> = {};
        if (type === 'dropdown') {
            config.options = dropdownOptions.map(o => o.trim()).filter(Boolean);
        }

        onSave({
            id: initialData?.id || `field_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: name.trim(),
            type,
            required,
            position: initialData?.position || 0,
            config,
        });
    };

    return (
        <div className="intg-field-editor-box" data-testid="field-editor">
            {/* Field Name: Frame 16 + Frame 12 */}
            <div className="intg-editor-form-group">
                <label className="intg-custom-label">
                    Field Name <span className="intg-custom-required">*</span>
                </label>
                <input 
                    type="text" 
                    className="intg-editor-input" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter field name"
                    autoFocus
                />
                {!nameValid && name.length > 0 && (
                    <span className="intg-editor-error-text">Field name is required</span>
                )}
            </div>

            {/* Field Type: Frame 16 + Frame 12 */}
            <div className="intg-editor-form-group">
                <label className="intg-custom-label">
                    Field Type <span className="intg-custom-required">*</span>
                </label>
                <select 
                    className="intg-editor-select" 
                    value={type} 
                    onChange={e => handleTypeChange(e.target.value as FormFieldType)}
                >
                    {FIELD_TYPE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>

            {/* If Dropdown, display options management */}
            {type === 'dropdown' && (
                <div className="intg-editor-form-group intg-dropdown-options-group">
                    <label className="intg-custom-label">Options</label>
                    <div className="intg-dropdown-options-list">
                        {dropdownOptions.map((opt, i) => (
                            <div key={i} className="intg-dropdown-option-row">
                                <input
                                    type="text"
                                    className="intg-editor-input intg-dropdown-option-input"
                                    value={opt}
                                    onChange={e => handleUpdateOption(i, e.target.value)}
                                    placeholder={`Option ${i + 1}`}
                                />
                                {dropdownOptions.length > 1 && (
                                    <button
                                        type="button"
                                        className="intg-dropdown-remove-btn"
                                        onClick={() => handleRemoveOption(i)}
                                        aria-label={`Remove option ${i + 1}`}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {hasEmptyOptions && dropdownOptions.length > 0 && (
                        <span className="intg-editor-error-text">Options cannot be empty</span>
                    )}
                    {hasDuplicateOptions && (
                        <span className="intg-editor-error-text">Options must be unique</span>
                    )}
                    {!hasEnoughOptions && (
                        <span className="intg-editor-error-text">At least 1 option is required</span>
                    )}

                    <button
                        type="button"
                        className="intg-editor-add-option-btn"
                        onClick={handleAddOption}
                    >
                        <Plus size={14} /> Add Option
                    </button>
                </div>
            )}

            {/* Required Field Checkbox: Frame 249 */}
            <label className="intg-editor-checkbox-label">
                <input 
                    type="checkbox" 
                    className="intg-editor-checkbox"
                    checked={required} 
                    onChange={e => setRequired(e.target.checked)} 
                />
                <span className="intg-editor-checkbox-text">Required Field</span>
            </label>

            {/* Divider: Rectangle 4477 */}
            <div className="intg-editor-divider" />

            {/* Actions: Frame 2147225510 */}
            <div className="intg-editor-actions">
                <button 
                    type="button" 
                    className="intg-editor-btn intg-editor-btn-cancel" 
                    onClick={onCancel}
                >
                    Cancel
                </button>
                <button 
                    type="button" 
                    className="intg-editor-btn intg-editor-btn-add" 
                    onClick={handleSave} 
                    disabled={!isValid}
                >
                    {initialData ? 'Save Changes' : 'Add Field'}
                </button>
            </div>
        </div>
    );
}
