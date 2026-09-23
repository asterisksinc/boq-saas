"use client";

import { FormattedRecentChange } from "@/lib/settings/types";

interface SettingsRecentChangesProps {
    recentChanges: FormattedRecentChange[];
}

export default function SettingsRecentChanges({
    recentChanges,
}: SettingsRecentChangesProps) {
    return (
        <section className="settings-section" aria-labelledby="recent-changes-heading">
            <h2 id="recent-changes-heading" className="settings-section-heading">
                Recent Changes
            </h2>

            <div className="settings-recent-changes-card">
                {recentChanges.length === 0 ? (
                    <div className="settings-recent-empty">
                        <p>No recent activity recorded</p>
                    </div>
                ) : (
                    <ul className="settings-recent-list">
                        {recentChanges.map((change) => (
                            <li key={change.id} className="settings-recent-item">
                                <div className="settings-recent-left">
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
                                        <span className="settings-recent-actor">
                                            {change.actorName}
                                        </span>
                                        <span className="settings-recent-desc">
                                            {change.description}
                                        </span>
                                    </div>
                                </div>
                                <span className="settings-recent-time">
                                    {change.timeAgo}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}
