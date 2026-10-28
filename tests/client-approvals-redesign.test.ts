import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("Client Activities - Approvals Page Redesign (Figma CSS Quick Mock /* Activities - Approvals */)", () => {
    const pagePath = join(process.cwd(), "app", "client", "approvals", "page.tsx");
    const drawerPath = join(process.cwd(), "components", "client", "ApprovalDetailDrawer.tsx");
    const cssPath = join(process.cwd(), "app", "client", "client-redesign.css");

    it("verifies the page, drawer component, and stylesheet exist", () => {
        expect(existsSync(pagePath), "Approvals page component must exist").toBe(true);
        expect(existsSync(drawerPath), "ApprovalDetailDrawer component must exist").toBe(true);
        expect(existsSync(cssPath), "Client redesign stylesheet must exist").toBe(true);
    });

    const pageCode = readFileSync(pagePath, "utf-8");
    const drawerCode = readFileSync(drawerPath, "utf-8");
    const cssCode = readFileSync(cssPath, "utf-8");

    describe("1. Page Shell & Global Header Integration", () => {
        it("embeds client redesign shell, background glow, and rail", () => {
            expect(pageCode).toContain('className="client-redesign-shell"');
            expect(pageCode).toContain('className="client-bg-glow"');
            expect(pageCode).toContain('ClientDashboardRail current="/client/approvals"');
            expect(pageCode).toContain('DashboardHeader');
            expect(pageCode).toContain('title="Approvals"');
            expect(pageCode).toContain('hideNew={true}');
        });

        it("wraps page content in client-approvals-workspace", () => {
            expect(pageCode).toContain("client-approvals-workspace");
        });
    });

    describe("2. Top 4 KPI Cards (Frame 2147225138)", () => {
        it("renders all four KPI cards: Total Approvals, Overdue, In-Review, Approved", () => {
            expect(pageCode).toContain("Total Approvals");
            expect(pageCode).toContain("Overdue");
            expect(pageCode).toContain("In-Review");
            expect(pageCode).toContain("Approved");
            expect(pageCode).toContain("client-approvals-kpi-row");
            expect(pageCode).toContain("client-approvals-kpi-card");
            expect(pageCode).toContain("client-approvals-kpi-label");
            expect(pageCode).toContain("client-approvals-kpi-val");
        });

        it("renders trend arrows, percentage values, and relative comparison texts", () => {
            expect(pageCode).toContain("client-approvals-kpi-trend");
            expect(pageCode).toContain("client-approvals-kpi-trend-pill");
            expect(pageCode).toContain("client-approvals-kpi-trend-text");
            expect(pageCode).toContain("vs last month");
            expect(pageCode).toContain("vs yesterday");
            expect(pageCode).toContain("ArrowUpRight");
            expect(pageCode).toContain("ArrowDownRight");
        });

        it("implements interactive KPI card filtering with active visual state", () => {
            expect(pageCode).toContain("handleToggleKpiFilter");
            expect(pageCode).toContain("statusFilter");
            expect(pageCode).toContain('${statusFilter === null ? "active" : ""}');
            expect(pageCode).toContain('${statusFilter === "overdue" ? "active" : ""}');
            expect(pageCode).toContain('${statusFilter === "in_review" ? "active" : ""}');
            expect(pageCode).toContain('${statusFilter === "approved" ? "active" : ""}');
        });
    });

    describe("3. Table Container & Header (Frame 2147225067 & Frame 57)", () => {
        it("embeds the table inside a glassmorphic panel container with 20px padding and 32px gap", () => {
            expect(pageCode).toContain("client-approvals-table-card");
            expect(pageCode).toContain("client-approvals-table-wrap");
            expect(pageCode).toContain("client-approvals-table");
        });

        it("defines table header row with #E4ECFB background and 36px height", () => {
            expect(pageCode).toContain("client-approvals-thead");
            expect(pageCode).toContain("client-approvals-th");
        });

        it("renders the required visible columns: APPROVAL NAME, STAGE, REQUESTED BY, STATUS, DUE DATE, REQUESTED DATE, ACTIONS", () => {
            expect(pageCode).toContain("APPROVAL NAME");
            expect(pageCode).toContain("STAGE");
            expect(pageCode).toContain("REQUESTED BY");
            expect(pageCode).toContain("STATUS");
            expect(pageCode).toContain("DUE DATE");
            expect(pageCode).toContain("REQUESTED DATE");
        });
    });

    describe("4. Table Rows, Stage & Status Badges, and Metadata Stacks", () => {
        it("renders table row with 56px height, hover effect, and click handler opening the drawer", () => {
            expect(pageCode).toContain("client-approvals-tr");
            expect(pageCode).toContain("client-approvals-td");
            expect(pageCode).toContain("handleOpenDrawer");
        });

        it("renders STAGE pill in #2563EB with 12px Urbanist font", () => {
            expect(pageCode).toContain("client-approvals-stage-pill");
            expect(pageCode).toContain("getStageBadgeStyle");
        });

        it("renders REQUESTED BY stack with user name and role", () => {
            expect(pageCode).toContain("client-approvals-stack");
            expect(pageCode).toContain("client-approvals-primary-text");
            expect(pageCode).toContain("client-approvals-secondary-text");
            expect(pageCode).toContain("requesterName");
            expect(pageCode).toContain("requesterRole");
        });

        it("renders STATUS pills with exact classes: yet-to-approve, approved, changes-required, rejected", () => {
            expect(pageCode).toContain("client-approvals-status-pill");
            expect(pageCode).toContain("yet-to-approve");
            expect(pageCode).toContain("approved");
            expect(pageCode).toContain("changes-required");
            expect(pageCode).toContain("rejected");
        });

        it("renders DUE DATE with primary date and relative subtext indicator", () => {
            expect(pageCode).toContain("dueDateInfo.text");
            expect(pageCode).toContain("dueDateInfo.subtext");
            expect(pageCode).toContain("client-approvals-overdue-text");
        });

        it("renders 3-dot row action popover with quick actions", () => {
            expect(pageCode).toContain("MoreHorizontal");
            expect(pageCode).toContain("client-menu-popover");
            expect(pageCode).toContain("View Approval");
            expect(pageCode).toContain("handleQuickAction");
        });
    });

    describe("5. Pagination Bar (Frame 2147225166)", () => {
        it("renders pagination bar with Total Approvals count, numeric buttons, and Show per Page selector", () => {
            expect(pageCode).toContain("client-approvals-pagination-bar");
            expect(pageCode).toContain("client-approvals-total-label");
            expect(pageCode).toContain("Total Approvals:");
            expect(pageCode).toContain("client-approvals-pagination-controls");
            expect(pageCode).toContain("client-approvals-page-btn");
            expect(pageCode).toContain("client-approvals-per-page");
            expect(pageCode).toContain("Show per Page:");
            expect(pageCode).toContain("client-approvals-per-page-select");
        });

        it("supports page size options 10, 20, 50 and handles previous/next navigation", () => {
            expect(pageCode).toContain("<option value={10}>10</option>");
            expect(pageCode).toContain("<option value={20}>20</option>");
            expect(pageCode).toContain("<option value={50}>50</option>");
            expect(pageCode).toContain("ChevronLeft");
            expect(pageCode).toContain("ChevronRight");
        });
    });

    describe("6. Real Backend Integration & Drawer Workflow", () => {
        it("uses authoritative client API methods without mocks", () => {
            expect(pageCode).toContain("listClientApprovals");
            expect(pageCode).toContain("submitClientApprovalDecision");
            expect(drawerCode).toContain("submitClientApprovalDecision");
            expect(drawerCode).toContain("addClientApprovalComment");
        });

        it("integrates ApprovalDetailDrawer with state refresh callback", () => {
            expect(pageCode).toContain("ApprovalDetailDrawer");
            expect(pageCode).toContain("approval={selectedApproval}");
            expect(pageCode).toContain("isOpen={drawerOpen}");
            expect(pageCode).toContain("loadApprovals();");
        });
    });

    describe("7. Design System CSS Tokens in client-redesign.css", () => {
        it("defines .client-approvals-kpi-card with glassmorphism surface and hover/active states", () => {
            expect(cssCode).toContain(".client-approvals-kpi-card");
            expect(cssCode).toContain("background: rgba(255, 255, 255, 0.6)");
            expect(cssCode).toContain("backdrop-filter: blur(20.4px)");
            expect(cssCode).toContain("border-radius: 6px");
            expect(cssCode).toContain(".client-approvals-kpi-card.active");
            expect(cssCode).toContain("border: 1.5px solid #2563EB");
        });

        it("defines .client-approvals-table-card with 20px padding and 32px gap", () => {
            expect(cssCode).toContain(".client-approvals-table-card");
            expect(cssCode).toContain("padding: 20px");
            expect(cssCode).toContain("gap: 32px");
        });

        it("defines .client-approvals-thead with #E4ECFB background", () => {
            expect(cssCode).toContain(".client-approvals-thead");
            expect(cssCode).toContain("background: #E4ECFB");
        });

        it("defines .client-approvals-stage-pill with #2563EB and 9999px radius", () => {
            expect(cssCode).toContain(".client-approvals-stage-pill");
            expect(cssCode).toContain("border-radius: 9999px");
            expect(cssCode).toContain("color: #2563EB");
        });

        it("defines .client-approvals-status-pill status classes", () => {
            expect(cssCode).toContain(".client-approvals-status-pill.yet-to-approve");
            expect(cssCode).toContain(".client-approvals-status-pill.approved");
            expect(cssCode).toContain(".client-approvals-status-pill.changes-required");
            expect(cssCode).toContain(".client-approvals-status-pill.rejected");
        });

        it("defines .client-approvals-pagination-bar and .client-approvals-page-btn with 34x34px dimensions", () => {
            expect(cssCode).toContain(".client-approvals-pagination-bar");
            expect(cssCode).toContain(".client-approvals-page-btn");
            expect(cssCode).toContain("width: 34px");
            expect(cssCode).toContain("height: 34px");
            expect(cssCode).toContain(".client-approvals-page-btn.active");
            expect(cssCode).toContain("background: #E4ECFB");
            expect(cssCode).toContain("border: 1px solid #2563EB");
        });
    });

    describe("8. View Approval Detail Drawer Design System (Figma CSS Quick Mock /* Activities - Approvals - New Approval */)", () => {
        it("embeds .client-approval-drawer-backdrop with rgba(0, 0, 0, 0.25) and 4.25px blur", () => {
            expect(cssCode).toContain(".client-approval-drawer-backdrop");
            expect(cssCode).toContain("background: rgba(0, 0, 0, 0.25)");
            expect(cssCode).toContain("backdrop-filter: blur(4.25px)");
            expect(drawerCode).toContain('className="client-approval-drawer-backdrop"');
        });

        it("defines .client-approval-drawer-card with 740px width, 16px radius, and 20.4px blur (Frame 2147225094)", () => {
            expect(cssCode).toContain(".client-approval-drawer-card");
            expect(cssCode).toContain("width: 740px");
            expect(cssCode).toContain("background: rgba(255, 255, 255, 0.6)");
            expect(cssCode).toContain("border-radius: 16px");
            expect(cssCode).toContain("backdrop-filter: blur(20.4px)");
            expect(drawerCode).toContain('className="client-approval-drawer-card"');
        });

        it("renders drawer header with View Approval title and 24px close button (Frame 2147225093)", () => {
            expect(drawerCode).toContain('className="client-approval-drawer-header"');
            expect(drawerCode).toContain('className="client-approval-drawer-title"');
            expect(drawerCode).toContain("View Approval");
            expect(drawerCode).toContain('className="client-approval-drawer-close-btn"');
            expect(cssCode).toContain(".client-approval-drawer-title");
            expect(cssCode).toContain("color: #0F172A");
        });

        it("renders inner white main container with 14px radius and scrollable body (Frame 2147225027 & Frame 2147225497)", () => {
            expect(drawerCode).toContain('className="client-approval-drawer-main"');
            expect(drawerCode).toContain('className="client-approval-drawer-content-scroll"');
            expect(cssCode).toContain(".client-approval-drawer-main");
            expect(cssCode).toContain("border-radius: 14px");
            expect(cssCode).toContain("background: #FFFFFF");
        });

        it("renders requester metadata header with title and subtitle (Frame 2147225066 & Frame 2147225070)", () => {
            expect(drawerCode).toContain('className="client-approval-drawer-meta-header"');
            expect(drawerCode).toContain('className="client-approval-drawer-req-title"');
            expect(drawerCode).toContain('className="client-approval-drawer-req-sub"');
            expect(drawerCode).toContain("requesterSubtitle");
        });

        it("renders nested information card with Project Name, Due Date, Stage pill, Status pill, and Description (Nested Frame 2147225027)", () => {
            expect(drawerCode).toContain('className="client-approval-drawer-info-card"');
            expect(drawerCode).toContain('className="client-approval-drawer-info-row"');
            expect(drawerCode).toContain('className="client-approval-drawer-info-cell');
            expect(drawerCode).toContain("Project Name");
            expect(drawerCode).toContain("Due Date");
            expect(drawerCode).toContain("Stage");
            expect(drawerCode).toContain("Status");
            expect(drawerCode).toContain('className="client-approval-drawer-info-pill stage"');
            expect(drawerCode).toContain("client-approval-drawer-desc-block");
            expect(drawerCode).toContain("client-approval-drawer-desc-val");
            expect(cssCode).toContain(".client-approval-drawer-info-card");
            expect(cssCode).toContain("box-shadow: 0px 0px 6px rgba(0, 0, 0, 0.06)");
        });

        it("renders attachments card with file count badge and file rows (Frame 2147225067 & Frame 2147225494)", () => {
            expect(drawerCode).toContain('className="client-approval-drawer-attach-card"');
            expect(drawerCode).toContain('className="client-approval-drawer-attach-title"');
            expect(drawerCode).toContain('className="client-approval-drawer-attach-pill"');
            expect(drawerCode).toContain("Files");
            expect(drawerCode).toContain('className="client-approval-drawer-file-row"');
            expect(drawerCode).toContain('className="client-approval-drawer-file-left"');
            expect(drawerCode).toContain("client-approval-drawer-file-icon-box");
            expect(drawerCode).toContain('className="client-approval-drawer-file-info"');
            expect(drawerCode).toContain('className="client-approval-drawer-file-name"');
            expect(drawerCode).toContain('className="client-approval-drawer-file-meta"');
            expect(drawerCode).toContain('className="client-approval-drawer-file-divider"');
        });

        it("defines file icon styling for PDF (#DC2626) and Excel (#1CB061) attachments", () => {
            expect(cssCode).toContain(".client-approval-drawer-file-icon-box.pdf");
            expect(cssCode).toContain("color: #DC2626");
            expect(cssCode).toContain("background: rgba(220, 38, 38, 0.1)");
            expect(cssCode).toContain(".client-approval-drawer-file-icon-box.excel");
            expect(cssCode).toContain("color: #1CB061");
            expect(cssCode).toContain("background: rgba(28, 176, 97, 0.2)");
        });

        it("renders formal client decision card with Approve, Request Changes, and Reject actions", () => {
            expect(drawerCode).toContain('className="client-approval-drawer-decision-card"');
            expect(drawerCode).toContain('className="client-approval-drawer-decision-actions"');
            expect(drawerCode).toContain('client-approval-drawer-action-btn approve');
            expect(drawerCode).toContain('client-approval-drawer-action-btn request-changes');
            expect(drawerCode).toContain('client-approval-drawer-action-btn reject');
            expect(cssCode).toContain(".client-approval-drawer-action-btn.approve");
            expect(cssCode).toContain("background: #16A34A");
        });

        it("renders bottom pinned feedback card with 48px input box and 73x46px Send button (Frame 2147225069 & Frame 12)", () => {
            expect(drawerCode).toContain('className="client-approval-drawer-feedback-card"');
            expect(drawerCode).toContain('className="client-approval-drawer-feedback-input-box"');
            expect(drawerCode).toContain('placeholder="Add a Feedback..."');
            expect(drawerCode).toContain('className="client-approval-drawer-attach-icon-btn"');
            expect(drawerCode).toContain('className="client-approval-drawer-send-btn"');
            expect(cssCode).toContain(".client-approval-drawer-feedback-card");
            expect(cssCode).toContain("height: 80px");
            expect(cssCode).toContain(".client-approval-drawer-feedback-input-box");
            expect(cssCode).toContain("height: 48px");
            expect(cssCode).toContain(".client-approval-drawer-send-btn");
            expect(cssCode).toContain("width: 73px");
            expect(cssCode).toContain("height: 46px");
            expect(cssCode).toContain("background: #2563EB");
        });

        it("defines responsive drawer rules for tablet (<=1024px) and mobile (<=640px)", () => {
            expect(cssCode).toContain("@media (max-width: 1024px)");
            expect(cssCode).toContain(".client-approval-drawer-card");
            expect(cssCode).toContain("@media (max-width: 640px)");
            expect(cssCode).toContain(".client-approval-drawer-card");
            expect(cssCode).toContain("border-radius: 0");
        });
    });
});
