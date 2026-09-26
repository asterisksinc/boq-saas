"use client";

import { GripVertical, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { CustomFormField } from '@/lib/integrations/types';

const fieldTypeLabels: Record<string, string> = {
    short_answer: 'Short Answer',
    long_answer: 'Long Answer',
    dropdown: 'Drop Down',
    checkbox: 'Check Box',
    link: 'Link',
};

interface Props {
    field: CustomFormField;
    onEdit: () => void;
    onDelete: () => void;
    index: number;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
}

export default function FormFieldRow({ field, onEdit, onDelete, index, onMoveUp, onMoveDown }: Props) {
    return (
        <div className="intg-field-row">
            <div className="intg-field-row-drag">
                {onMoveUp && <button className="intg-field-reorder" onClick={onMoveUp} aria-label="Move up"><ChevronUp size={14} /></button>}
                <GripVertical size={16} className="intg-grip" />
                {onMoveDown && <button className="intg-field-reorder" onClick={onMoveDown} aria-label="Move down"><ChevronDown size={14} /></button>}
            </div>
            <span className="intg-field-name">{field.name}{field.required && <span className="text-red"> *</span>}</span>
            <span className="intg-field-type-badge">{fieldTypeLabels[field.type] || field.type}</span>
            <div className="intg-field-actions">
                <button className="intg-field-action-btn" onClick={onEdit} aria-label="Edit field"><Pencil size={14} /></button>
                <button className="intg-field-action-btn intg-field-action-delete" onClick={onDelete} aria-label="Delete field"><Trash2 size={14} /></button>
            </div>
        </div>
    );
}
