"use client";

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { CustomFormField } from '@/lib/integrations/types';
import FormFieldRow from './FormFieldRow';
import FieldEditor from './FieldEditor';

interface Props {
    formName: string;
    setFormName: (val: string) => void;
    fields: CustomFormField[];
    setFields: (fields: CustomFormField[]) => void;
    onNext: () => void;
    onBack: () => void;
    onCancel: () => void;
    onClose?: () => void;
    saving?: boolean;
}

export default function FormDetailsStep({ 
    formName, 
    setFormName, 
    fields, 
    setFields, 
    onNext, 
    onBack, 
    onCancel, 
    onClose,
    saving 
}: Props) {
    const [addingField, setAddingField] = useState(false);
    const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

    const handleSaveField = (field: CustomFormField) => {
        if (editingFieldId) {
            setFields(fields.map(f => f.id === field.id ? field : f));
        } else {
            setFields([...fields, { ...field, position: fields.length }]);
        }
        setAddingField(false);
        setEditingFieldId(null);
    };

    const handleDelete = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
        if (editingFieldId === id) setEditingFieldId(null);
    };

    const handleReorder = (fromIndex: number, toIndex: number) => {
        const reordered = [...fields];
        const [moved] = reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, moved);
        setFields(reordered.map((f, i) => ({ ...f, position: i })));
    };

    return (
        <div className="intg-custom-step-container">
            {/* Header: Frame 2147225093 */}
            <div className="intg-custom-modal-header">
                <div className="intg-custom-modal-title-group">
                    <h2 className="intg-custom-modal-title">Form Details</h2>
                    <p className="intg-custom-modal-subtitle">Add basic details for your form</p>
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
                {/* Form Name Input */}
                <div className="intg-custom-form-group">
                    <label className="intg-custom-label">
                        Form Name <span className="intg-custom-required">*</span>
                    </label>
                    <input 
                        type="text" 
                        className="intg-custom-input" 
                        value={formName} 
                        onChange={e => setFormName(e.target.value)} 
                        placeholder="Enter form name"
                    />
                </div>

                {/* Fields Section: Frame 2147225438 */}
                <div className="intg-fields-section">
                    <label className="intg-fields-section-title">Fields</label>

                    <div className="intg-fields-list">
                        {fields.map((field, index) => (
                            <div key={field.id} className="intg-field-row-wrapper">
                                {editingFieldId === field.id ? (
                                    <FieldEditor
                                        initialData={field}
                                        onSave={handleSaveField}
                                        onCancel={() => setEditingFieldId(null)}
                                    />
                                ) : (
                                    <FormFieldRow 
                                        field={field} 
                                        onEdit={() => {
                                            setEditingFieldId(field.id);
                                            setAddingField(false);
                                        }} 
                                        onDelete={() => handleDelete(field.id)}
                                        index={index}
                                        onMoveUp={index > 0 ? () => handleReorder(index, index - 1) : undefined}
                                        onMoveDown={index < fields.length - 1 ? () => handleReorder(index, index + 1) : undefined}
                                    />
                                )}
                            </div>
                        ))}

                        {/* Inline Add Field Box: Frame 2147225130 */}
                        {addingField && (
                            <FieldEditor
                                initialData={null}
                                onSave={handleSaveField}
                                onCancel={() => setAddingField(false)}
                            />
                        )}
                    </div>

                    {/* "+ Add New Field" button */}
                    {!addingField && !editingFieldId && (
                        <button 
                            type="button" 
                            className="intg-add-new-field-btn" 
                            onClick={() => setAddingField(true)}
                        >
                            <Plus size={18} />
                            <span>Add New Field</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Footer Actions: Frame 2147225094 */}
            <div className="intg-custom-modal-footer intg-custom-footer-form-details">
                <button 
                    type="button" 
                    className="intg-custom-btn intg-custom-btn-back" 
                    onClick={onBack}
                >
                    Back
                </button>
                <div className="intg-custom-footer-right-group">
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
                        disabled={!formName.trim() || saving || !!editingFieldId || addingField}
                    >
                        {saving ? 'Saving...' : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    );
}
