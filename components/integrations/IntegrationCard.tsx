"use client";

import { ChevronRight, Loader2 } from "lucide-react";
import { IntegrationDefinition, Integration } from "@/lib/integrations/types";

interface Props {
    definition: IntegrationDefinition;
    integration?: Integration;
    onConnect: (provider: string) => void;
    onDisconnect: (integrationId: string) => void;
    onClick: () => void;
    actionLoading?: boolean;
    disabled?: boolean;
}

export default function IntegrationCard({
    definition,
    integration,
    onConnect,
    onDisconnect,
    onClick,
    actionLoading = false,
    disabled = false,
}: Props) {
    const isConnected = integration?.status === "connected";
    const status = integration?.status || "not_connected";

    const getStatusText = () => {
        switch (status) {
            case "connected":
                return "Connected";
            case "paused":
                return "Paused";
            case "connecting":
                return "Connecting...";
            case "error":
                return "Error";
            default:
                return "Not Connected";
        }
    };

    const handleActionClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (disabled || actionLoading) return;

        if (isConnected && integration?.id) {
            onDisconnect(integration.id);
        } else {
            onConnect(definition.provider);
        }
    };

    return (
        <div
            className="intg-card"
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onClick();
                }
            }}
        >
            <div className="intg-card-header">
                <div className="intg-card-header-main">
                    <div className="intg-icon-wrapper">
                        <img src={definition.iconPath} alt="" aria-hidden="true" />
                    </div>
                    <div className="intg-card-meta">
                        <h3 className="intg-card-title">{definition.title}</h3>
                        <div className={`intg-status-indicator intg-status-${status}`}>
                            <span className="intg-status-dot" />
                            <span className="intg-status-label">{getStatusText()}</span>
                        </div>
                    </div>
                </div>
                <button
                    type="button"
                    className="intg-card-arrow"
                    aria-label={`View ${definition.title} details`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onClick();
                    }}
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            <div className="intg-card-body">
                <p>{definition.description}</p>
            </div>

            <div className="intg-card-footer">
                <button
                    type="button"
                    className={`intg-btn ${isConnected ? "intg-btn-disconnect" : "intg-btn-connect"}`}
                    onClick={handleActionClick}
                    disabled={disabled || actionLoading}
                    title={disabled ? "Only owners and admins can manage integrations." : undefined}
                >
                    {actionLoading ? (
                        <>
                            <Loader2 size={16} className="spin" />
                            <span>{isConnected ? "Disconnecting..." : "Connecting..."}</span>
                        </>
                    ) : isConnected ? (
                        "Disconnect"
                    ) : (
                        "Connect"
                    )}
                </button>
            </div>
        </div>
    );
}
