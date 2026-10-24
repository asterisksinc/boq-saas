"use client";

import { FormattedRecentChange } from "@/lib/settings/types";

interface SettingsRecentChangesProps {
    recentChanges: FormattedRecentChange[];
}

export default function SettingsRecentChanges({
    recentChanges,
}: SettingsRecentChangesProps) {
    return (
        <section className="settings-recent-card" aria-labelledby="recent-changes-heading">
            <h2 id="recent-changes-heading" className="settings-section-heading">
                Recent Changes
            </h2>

            {recentChanges.length === 0 ? (
                <div className="settings-recent-empty">
                    <p>No recent activity recorded</p>
                </div>
            ) : (
                <div className="settings-recent-list">
                    {recentChanges.map((change, index) => (
                        <div key={change.id} className="settings-recent-entry">
                            <div className="settings-recent-row">
                                <div className="settings-recent-avatar" aria-hidden="true">
                                    {change.actorAvatarUrl ? (
                                        <img
                                            src={change.actorAvatarUrl}
                                            alt=""
                                            className="settings-recent-img"
                                        />
                                    ) : (
                                        <span>{change.actorInitials}</span>
                                    )}
                                </div>
                                <div className="settings-recent-content">
                                    <div className="settings-recent-details">
                                        <span className="settings-recent-actor">
                                            {change.actorName}
                                        </span>
                                        <span className="settings-recent-desc">
                                            {change.description}
                                        </span>
                                    </div>
                                    <span className="settings-recent-time">
                                        {change.timeAgo}
                                    </span>
                                </div>
                            </div>
                            {index < recentChanges.length - 1 && (
                                <div className="settings-recent-divider" />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
