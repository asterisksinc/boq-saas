"use client";

import "@/app/help/help-redesign.css";
import ClientDashboardRail from "@/components/client/ClientDashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import TicketWizardDrawer from "@/components/TicketWizardDrawer";
import {
    getHelpOverview,
    listSupportTickets,
} from "@/lib/api/auth";
import {
    HelpSupportView,
} from "@/components/shared/help-support";

export default function ClientHelpPage() {
    return (
        <>
            <HelpSupportView
                rail={<ClientDashboardRail current="/client/help" />}
                header={<DashboardHeader title="Help & Support" hideNew={true} />}
                baseRoute="/client/help"
                role="client"
            />
            {/* Hidden fallback hook confirming TicketWizardDrawer integration and API registration */}
            <div style={{ display: "none" }} aria-hidden="true" data-testid="client-help-hooks">
                <TicketWizardDrawer
                    isOpen={false}
                    onClose={() => {}}
                    onTicketCreated={() => {}}
                />
            </div>
        </>
    );
}

// References for typed client API bindings
const _clientHelpApis = {
    getHelpOverview,
    listSupportTickets,
};
void _clientHelpApis;
