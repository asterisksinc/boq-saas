"use client";

import { IntegrationCategory } from '@/lib/integrations/types';

interface Props {
    title: string;
    category: IntegrationCategory;
    children: React.ReactNode;
}

export default function IntegrationSection({ title, category, children }: Props) {
    return (
        <section className="intg-section">
            <h2 className="intg-section-title">{title}</h2>
            <div className="intg-section-cards" data-category={category}>
                {children}
            </div>
        </section>
    );
}
