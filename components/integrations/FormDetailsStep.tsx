"use client";

import { useState } from 'react';
import { CustomFormField, FormFieldType } from '@/lib/integrations/types';
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
    saving?: boolean;
}

export default function FormDetailsStep({ formName, setFormName, fields, setFields, onNext, onBack, onCancel, saving }: Props) {
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
        <div className="intg-modal-content">
            <h2>Form Details</h2>
            <p className="intg-modal-subtitle">Configure your lead capture form fields.</p>
            
            <div className="intg-form-group">
                <label>Form Name <span className="text-red">*</span></label>
                <input 
                    type="text" 
                    className="intg-input" 
                    value={formName} 
                    onChange={e => setFormName(e.target.value)} 
                    placeholder="e.g. Contact Us Form"
                />
            </div>

            <div className="intg-fields-section">
                <div className="intg-fields-section-header">
                    <h3>Fields</h3>
                    <span className="intg-fields-count">{fields.length} field{fields.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="intg-fields-list">
                    {fields.length === 0 && !addingField && <p className="intg-muted text-sm">No fields added yet. Click &quot;Add New Field&quot; below.</p>}
                    
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
                    
                    {addingField && (
                        <FieldEditor
                            initialData={null}
                            onSave={handleSaveField}
                            onCancel={() => setAddingField(false)}
                        />
                    )}
                </div>
                
                {!addingField && !editingFieldId && (
                    <button className="intg-btn intg-btn-outline intg-btn-add-field" onClick={() => setAddingField(true)}>
                        + Add New Field
                    </button>
                )}
            </div>

            <div className="intg-modal-actions">
                <button className="intg-btn intg-btn-modal-cancel" onClick={onCancel}>Cancel</button>
                <button className="intg-btn intg-btn-secondary" onClick={onBack}>Back</button>
                <button className="intg-btn intg-btn-primary" onClick={onNext} disabled={!formName.trim() || saving || !!editingFieldId || addingField}>
                    {saving ? 'Saving…' : 'Save & Complete'}
                </button>
            </div>
        </div>
    );
}
