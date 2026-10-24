"use client";

import { useState } from "react";
import { Check, Copy, Loader2, X } from "lucide-react";
import { IntegrationProvider } from "@/lib/integrations/types";
import { getDefinition } from "@/lib/integrations/definitions";

interface Props {
    provider: IntegrationProvider;
    loading?: boolean;
    onConnect: (config: Record<string, unknown>) => Promise<void>;
    onCancel: () => void;
}

export default function ProviderConnectDialog({
    provider,
    loading = false,
    onConnect,
    onCancel,
}: Props) {
    const def = getDefinition(provider);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form states
    // Meta Lead Ads
    const [pageName, setPageName] = useState("");
    const [adAccountId, setAdAccountId] = useState("");
    const [formName, setFormName] = useState("");

    // Google Ads
    const [customerId, setCustomerId] = useState("");
    const [webhookKey, setWebhookKey] = useState("boq_gads_" + Math.random().toString(36).substring(2, 9));

    // WhatsApp
    const [phoneNumber, setPhoneNumber] = useState("");
    const [wabaId, setWabaId] = useState("");
    const [apiToken, setApiToken] = useState("");

    // Email
    const [senderName, setSenderName] = useState("");
    const [senderEmail, setSenderEmail] = useState("");
    const [emailProvider, setEmailProvider] = useState("smtp");
    const [smtpHost, setSmtpHost] = useState("");

    // Razorpay
    const [keyId, setKeyId] = useState("");
    const [keySecret, setKeySecret] = useState("");
    const [currency, setCurrency] = useState("INR");

    const webhookEndpoint = typeof window !== "undefined"
        ? `${window.location.origin}/api/v1/integrations/webhook/${provider}`
        : `/api/v1/integrations/webhook/${provider}`;

    const handleCopyWebhook = () => {
        navigator.clipboard.writeText(webhookEndpoint);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        let config: Record<string, unknown> = {};

        if (provider === "meta_lead_ads") {
            if (!pageName.trim()) {
                setError("Please enter your Facebook Page Name or ID.");
                return;
            }
            config = { pageName: pageName.trim(), adAccountId: adAccountId.trim(), formName: formName.trim() };
        } else if (provider === "google_ads") {
            if (!customerId.trim()) {
                setError("Please enter your Google Ads Customer ID.");
                return;
            }
            config = { customerId: customerId.trim(), webhookKey, webhookUrl: webhookEndpoint };
        } else if (provider === "whatsapp") {
            if (!phoneNumber.trim()) {
                setError("Please enter your WhatsApp Business phone number.");
                return;
            }
            config = { phoneNumber: phoneNumber.trim(), wabaId: wabaId.trim(), apiToken: apiToken.trim() };
        } else if (provider === "email") {
            if (!senderEmail.trim()) {
                setError("Please enter a valid sender email address.");
                return;
            }
            config = { senderName: senderName.trim(), senderEmail: senderEmail.trim(), provider: emailProvider, smtpHost: smtpHost.trim() };
        } else if (provider === "razorpay") {
            if (!keyId.trim()) {
                setError("Please enter your Razorpay Key ID.");
                return;
            }
            config = { keyId: keyId.trim(), keySecret: keySecret.trim(), currency };
        }

        try {
            await onConnect(config);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to connect integration.");
        }
    };

    return (
        <div className="intg-modal-backdrop" onClick={() => !loading && onCancel()} role="presentation">
            <div
                className="intg-modal-dialog intg-connect-dialog"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    className="intg-modal-close"
                    onClick={onCancel}
                    disabled={loading}
                    aria-label="Close dialog"
                >
                    <X size={18} />
                </button>

                <div className="intg-connect-header">
                    <div className="intg-icon-wrapper">
                        {def?.iconPath && <img src={def.iconPath} alt="" aria-hidden="true" />}
                    </div>
                    <div>
                        <h2 className="intg-connect-title">Connect {def?.title || "Integration"}</h2>
                        <p className="intg-connect-subtitle">{def?.description}</p>
                    </div>
                </div>

                {error && <div className="intg-form-error" role="alert">{error}</div>}

                <form onSubmit={handleSubmit} className="intg-connect-form">
                    {/* Meta Lead Ads */}
                    {provider === "meta_lead_ads" && (
                        <>
                            <div className="intg-form-group">
                                <label className="intg-form-label" htmlFor="meta-page">Facebook Page Name or ID *</label>
                                <input
                                    id="meta-page"
                                    type="text"
                                    className="intg-form-input"
                                    placeholder="e.g. Acme Interiors & Design"
                                    value={pageName}
                                    onChange={(e) => setPageName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="intg-form-group">
                                <label className="intg-form-label" htmlFor="meta-ad-account">Ad Account ID (optional)</label>
                                <input
                                    id="meta-ad-account"
                                    type="text"
                                    className="intg-form-input"
                                    placeholder="act_1234567890"
                                    value={adAccountId}
                                    onChange={(e) => setAdAccountId(e.target.value)}
                                />
                            </div>
                            <div className="intg-form-group">
                                <label className="intg-form-label" htmlFor="meta-form">Default Lead Form Name (optional)</label>
                                <input
                                    id="meta-form"
                                    type="text"
                                    className="intg-form-input"
                                    placeholder="e.g. Free Consultation Form"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    {/* Google Ads */}
                    {provider === "google_ads" && (
                        <>
                            <div className="intg-form-group">
                                <label className="intg-form-label" htmlFor="gads-customer">Google Ads Customer ID *</label>
                                <input
                                    id="gads-customer"
                                    type="text"
                                    className="intg-form-input"
                                    placeholder="e.g. 123-456-7890"
                                    value={customerId}
                                    onChange={(e) => setCustomerId(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="intg-form-group">
                                <label className="intg-form-label" htmlFor="gads-webhook">Webhook Delivery URL</label>
                                <div className="intg-copy-input-group">
                                    <input
                                        id="gads-webhook"
                                        type="text"
                                        readOnly
                                        className="intg-form-input"
                                        value={webhookEndpoint}
                                    />
                                    <button
                                        type="button"
                                        className="intg-copy-btn"
                                        onClick={handleCopyWebhook}
                                        title="Copy Webhook URL"
                                    >
                                        {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                                    </button>
                                </div>
                                <span className="intg-form-help">Paste this into your Google Ads Lead Form Asset Webhook settings.</span>
                            </div>
                            <div className="intg-form-group">
                                <label className="intg-form-label" htmlFor="gads-key">Webhook Key / Passcode</label>
                                <input
                                    id="gads-key"
                                    type="text"
                                    className="intg-form-input"
                                    value={webhookKey}
                                    onChange={(e) => setWebhookKey(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    {/* WhatsApp */}
                    {provider === "whatsapp" && (
                        <>
                            <div className="intg-form-group">
                                <label className="intg-form-label" htmlFor="wa-phone">WhatsApp Business Phone Number *</label>
                                <input
                                    id="wa-phone"
                                    type="text"
                                    className="intg-form-input"
                                    placeholder="e.g. +91 98765 43210"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="intg-form-group">
                                <label className="intg-form-label" htmlFor="wa-waba">Business Account ID (WABA) (optional)</label>
                                <input
                                    id="wa-waba"
                                    type="text"
                                    className="intg-form-input"
                                    placeholder="e.g. waba_8492019482"
                                    value={wabaId}
                                    onChange={(e) => setWabaId(e.target.value)}
                                />
                            </div>
                            <div className="intg-form-group">
                                <label className="intg-form-label" htmlFor="wa-token">API Key / Token (optional)</label>
                                <input
                                    id="wa-token"
                                    type="password"
                                    className="intg-form-input"
                                    placeholder="Enter access token"
                                    value={apiToken}
                                    onChange={(e) => setApiToken(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    {/* Email */}
                    {provider === "email" && (
                        <>
                            <div className="intg-form-group">
                                <label className="intg-form-label" htmlFor="email-sender-name">Sender Display Name</label>
                                <input
                                    id="email-sender-name"
                                    type="text"
                                    className="intg-form-input"
                                    placeholder="e.g. BOQ Billing Team"
                                    value={senderName}
                                    onChange={(e) => setSenderName(e.target.value)}
                                />
                            </div>
                            <div className="intg-form-group">
                                <label className="intg-form-label" htmlFor="email-sender-addr">Sender Email Address *</label>
                                <input
                                    id="email-sender-addr"
                                    type="email"
                                    className="intg-form-input"
                                    placeholder="e.g. billing@acmedesign.com"
                                    value={senderEmail}
                                    onChange={(e) => setSenderEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="intg-form-group">
                                <label className="intg-form-label" htmlFor="email-provider">Email Provider</label>
                                <select
                                    id="email-provider"
                                    className="intg-form-select"
                                    value={emailProvider}
                                    onChange={(e) => setEmailProvider(e.target.value)}
                                >
                                    <option value="smtp">Custom SMTP Server</option>
                                    <option value="google_workspace">Google Workspace / Gmail</option>
                                    <option value="sendgrid">SendGrid</option>
                                    <option value="resend">Resend</option>
                                </select>
                            </div>
                            <div className="intg-form-group">
                                <label className="intg-form-label" htmlFor="email-host">SMTP Host / Server (optional)</label>
                                <input
                                    id="email-host"
                                    type="text"
                                    className="intg-form-input"
                                    placeholder="e.g. smtp.gmail.com"
                                    value={smtpHost}
                                    onChange={(e) => setSmtpHost(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    {/* Razorpay */}
                    {provider === "razorpay" && (
                        <>
                            <div className="intg-form-group">
                                <label className="intg-form-label" htmlFor="rzp-key">Razorpay Key ID *</label>
                                <input
                                    id="rzp-key"
                                    type="text"
                                    className="intg-form-input"
                                    placeholder="rzp_live_xxxxxxxxxxxx"
                                    value={keyId}
                                    onChange={(e) => setKeyId(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="intg-form-group">
                                <label className="intg-form-label" htmlFor="rzp-secret">Key Secret</label>
                                <input
                                    id="rzp-secret"
                                    type="password"
                                    className="intg-form-input"
                                    placeholder="Enter secret key"
                                    value={keySecret}
                                    onChange={(e) => setKeySecret(e.target.value)}
                                />
                            </div>
                            <div className="intg-form-group">
                                <label className="intg-form-label" htmlFor="rzp-currency">Currency</label>
                                <select
                                    id="rzp-currency"
                                    className="intg-form-select"
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                >
                                    <option value="INR">INR (₹) - Indian Rupee</option>
                                    <option value="USD">USD ($) - US Dollar</option>
                                    <option value="AED">AED (د.إ) - UAE Dirham</option>
                                </select>
                            </div>
                        </>
                    )}

                    <div className="intg-connect-actions">
                        <button
                            type="button"
                            className="intg-btn intg-btn-modal-cancel"
                            onClick={onCancel}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="intg-btn intg-btn-primary"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Connecting...</span>
                                </>
                            ) : (
                                `Connect ${def?.title || "Integration"}`
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
