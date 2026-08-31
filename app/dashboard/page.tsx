import Link from "next/link";

export default function DashboardPage() {
    return (
        <main className="dashboard-page">
            <div className="dashboard-shell">
                <header className="dashboard-topbar">
                    <div>
                        <p className="eyebrow">Workspace overview</p>
                        <h1>Dashboard</h1>
                    </div>
                    <div className="dashboard-actions">
                        <Link href="/" className="ghost-link">Home</Link>
                    </div>
                </header>

                <section className="dashboard-card">
                    <h2>Dashboard</h2>
                    <p>Your workspace dashboard will appear here as we continue building it.</p>
                </section>
            </div>
        </main>
    );
}
