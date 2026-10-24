"use client";

import { useState, useRef, useEffect } from "react";
import { Folder, Loader2, MoreVertical, Plus, Trash2 } from "lucide-react";
import { IntegrationDefinition, Integration, IntegrationProvider } from "@/lib/integrations/types";

interface Props {
    definition: IntegrationDefinition;
    integration?: Integration;
    onConnect: (provider: IntegrationProvider) => void;
    onDisconnect: (integrationId: string, name: string) => void;
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
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const isConnected = integration?.status === "connected";
    const status = integration?.status || "not_connected";

    // Close menu when clicking outside or pressing Escape
    useEffect(() => {
        if (!menuOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMenuOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [menuOpen]);

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
            onDisconnect(integration.id, definition.title);
        } else {
            onConnect(definition.provider);
        }
    };

    const handleToggleMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        setMenuOpen((prev) => !prev);
    };

    const handleMenuDetails = (e: React.MouseEvent) => {
        e.stopPropagation();
        setMenuOpen(false);
        onClick();
    };

    const handleMenuDisconnect = (e: React.MouseEvent) => {
        e.stopPropagation();
        setMenuOpen(false);
        if (integration?.id) {
            onDisconnect(integration.id, definition.title);
        }
    };

    const handleMenuConnect = (e: React.MouseEvent) => {
        e.stopPropagation();
        setMenuOpen(false);
        onConnect(definition.provider);
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
            <div className="intg-card-top">
                <div className="intg-card-header">
                    <div className="intg-card-header-left">
                        <div className="intg-icon-wrapper">
                            <img src={definition.iconPath} alt="" aria-hidden="true" />
                        </div>
                        <div className="intg-card-title-col">
                            <h3 className="intg-card-title">{definition.title}</h3>
                            <div className={`intg-status-indicator intg-status-${status}`}>
                                <span className="intg-status-dot" />
                                <span className="intg-status-label">{getStatusText()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="intg-more-wrapper" ref={menuRef} onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            className="intg-card-more-btn"
                            aria-label={`Options for ${definition.title}`}
                            aria-expanded={menuOpen}
                            onClick={handleToggleMenu}
                        >
                            <MoreVertical size={18} />
                        </button>

                        {menuOpen && (
                            <div className="intg-more-popover" role="menu">
                                <button
                                    type="button"
                                    className="intg-more-item"
                                    role="menuitem"
                                    onClick={handleMenuDetails}
                                >
                                    <Folder size={16} />
                                    <span>{isConnected ? "View Details" : "Open Setup"}</span>
                                </button>
                                {isConnected ? (
                                    <button
                                        type="button"
                                        className="intg-more-item intg-more-item-danger"
                                        role="menuitem"
                                        onClick={handleMenuDisconnect}
                                        disabled={disabled || actionLoading}
                                    >
                                        <Trash2 size={16} />
                                        <span>Disconnect</span>
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="intg-more-item"
                                        role="menuitem"
                                        onClick={handleMenuConnect}
                                        disabled={disabled || actionLoading}
                                    >
                                        <Plus size={16} />
                                        <span>Connect</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <p className="intg-card-desc">{definition.description}</p>
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
                            <Loader2 size={16} className="animate-spin" />
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
