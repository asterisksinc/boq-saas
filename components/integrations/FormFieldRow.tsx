"use client";

import { GripVertical, Pencil, Trash2 } from 'lucide-react';
import { CustomFormField } from '@/lib/integrations/types';

const FIELD_TYPE_BADGES: Record<string, string> = {
    short_answer: 'SHORT ANSWER',
    long_answer: 'LONG ANSWER',
    dropdown: 'DROP DOWN',
    checkbox: 'CHECK BOX',
    link: 'LINK',
};

interface Props {
    field: CustomFormField;
    onEdit: () => void;
    onDelete: () => void;
    index: number;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
}

export default function FormFieldRow({ field, onEdit, onDelete }: Props) {
    const badgeText = FIELD_TYPE_BADGES[field.type] || field.type.replace(/_/g, ' ').toUpperCase();

    return (
        <div className="intg-field-row" data-field-id={field.id}>
            {/* Left side: Drag handle and Name */}
            <div className="intg-field-row-left">
                <span className="intg-field-drag-handle" title="Reorder field">
                    <GripVertical size={18} />
                </span>
                <span className="intg-field-row-name">
                    {field.name}
                    {field.required && <span className="intg-custom-required"> *</span>}
                </span>
            </div>

            {/* Type badge */}
            <div className="intg-field-type-pill">
                <span className="intg-field-type-pill-text">{badgeText}</span>
            </div>

            {/* Right side: Actions */}
            <div className="intg-field-row-actions">
                <button 
                    type="button" 
                    className="intg-field-icon-btn intg-field-edit-btn" 
                    onClick={onEdit} 
                    aria-label={`Edit ${field.name}`}
                    title="Edit field"
                >
                    <Pencil size={18} />
                </button>
                <button 
                    type="button" 
                    className="intg-field-icon-btn intg-field-delete-btn" 
                    onClick={onDelete} 
                    aria-label={`Delete ${field.name}`}
                    title="Delete field"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
}
