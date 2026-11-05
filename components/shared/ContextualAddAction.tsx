"use client";

import { Plus } from "lucide-react";

interface ContextualAddActionProps {
    entity: string;
    onClick: () => void;
    className?: string;
}

export default function ContextualAddAction({
    entity,
    onClick,
    className = "",
}: ContextualAddActionProps) {
    return (
        <button
            type="button"
            className={`contextual-add-action ${className}`.trim()}
            onClick={onClick}
            aria-label={`Add ${entity}`}
        >
            <Plus size={15} aria-hidden="true" />
            <span>Add {entity}</span>
        </button>
    );
}
