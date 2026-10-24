import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";

describe("User Dashboard → Razorpay View All Transactions Figma Redesign", () => {
    const pageCode = readFileSync("app/integrations/[id]/transactions/page.tsx", "utf8");
    const paginationCode = readFileSync("components/integrations/Pagination.tsx", "utf8");
    const cssCode = readFileSync("app/integrations/integrations.css", "utf8");
    const apiRouteCode = readFileSync("app/api/v1/[...path]/route.ts", "utf8");
    const apiLibCode = readFileSync("lib/api/integrations.ts", "utf8");

    describe("1. Parent Dashboard Shell & Elimination of Blank Right Space", () => {
        it("verifies View All Transactions page renders seamlessly inside DashboardRail and DashboardHeader", () => {
            expect(pageCode).toContain('<DashboardRail current="/integrations"');
            expect(pageCode).toContain('<DashboardHeader title="All Transactions"');
            expect(pageCode).toContain('className="fig-dashboard"');
            expect(pageCode).not.toContain('boq-dashboard');
            expect(pageCode).toContain('className="fig-dashboard-glow"');
            expect(pageCode).toContain('className="fig-dashboard-main"');
        });

        it("verifies View All Transactions page imports integrations.css for Figma styling tokens", () => {
            expect(pageCode).toContain("import '../../integrations.css';");
        });

        it("ensures page wrapper fills available dashboard width dynamically without excessive right blank space", () => {
            expect(cssCode).toContain(".razorpay-all-transactions-page {");
            expect(cssCode).toContain("width: 100%;");
            expect(cssCode).toContain("max-width: 100%;");
            expect(cssCode).toContain("min-width: 0;");
            expect(cssCode).toContain("box-sizing: border-box;");
        });

        it("ensures main transactions card panel spans full width with frosted glass Figma backdrop", () => {
            expect(cssCode).toContain(".razorpay-all-transactions-panel {");
            expect(cssCode).toContain("width: 100%;");
            expect(cssCode).toContain("max-width: 100%;");
            expect(cssCode).toContain("min-width: 0;");
            expect(cssCode).toContain("box-sizing: border-box;");
            expect(cssCode).toContain("backdrop-filter: blur(20px);");
            expect(cssCode).toContain("border-radius: 12px;");
        });
    });

    describe("2. Navigation & Back Action (Figma Frame 2147225070)", () => {
        it("renders back button linking back to the Razorpay Integration Detail page", () => {
            expect(pageCode).toContain('className="intg-detail-back-btn razorpay-back-btn"');
            expect(pageCode).toContain("router.push(`/integrations/${id}`)");
            expect(pageCode).toContain("<ArrowLeft size={16}");
            expect(pageCode).toContain("<span>Back</span>");
        });

        it("matches Figma Frame 2147225070 styling for back button", () => {
            expect(cssCode).toContain(".razorpay-back-btn {");
            expect(cssCode).toContain("color: #475569;");
            expect(cssCode).toContain("font-size: 16px;");
            expect(cssCode).toContain("font-weight: 500;");
        });
    });

    describe("3. Search, Filter & Action Toolbar", () => {
        it("renders responsive search box with icon and clear action", () => {
            expect(pageCode).toContain('className="razorpay-search-box"');
            expect(pageCode).toContain('placeholder="Search by ID, project, invoice, client..."');
            expect(pageCode).toContain('className="razorpay-search-input"');
            expect(pageCode).toContain('className="razorpay-search-clear"');

            expect(cssCode).toContain(".razorpay-search-box {");
            expect(cssCode).toContain(".razorpay-search-input {");
            expect(cssCode).toContain(".razorpay-search-input:focus {");
        });

        it("renders status filter select with all required statuses", () => {
            expect(pageCode).toContain('className="razorpay-filter-select"');
            expect(pageCode).toContain('<option value="all">All Statuses</option>');
            expect(pageCode).toContain('<option value="successful">Successful</option>');
            expect(pageCode).toContain('<option value="pending">Pending</option>');
            expect(pageCode).toContain('<option value="failed">Failed</option>');
        });

        it("renders payment method filter select with all major payment modes", () => {
            expect(pageCode).toContain('<option value="all">All Methods</option>');
            expect(pageCode).toContain('<option value="card">Card</option>');
            expect(pageCode).toContain('<option value="upi">UPI</option>');
            expect(pageCode).toContain('<option value="bank_transfer">Net Banking</option>');
            expect(pageCode).toContain('<option value="wallet">Wallet</option>');
        });

        it("renders clear filters button and refresh button with spinning icon state", () => {
            expect(pageCode).toContain('className="razorpay-clear-filters-btn"');
            expect(pageCode).toContain('className="razorpay-refresh-btn"');
            expect(pageCode).toContain("<RefreshCw");
        });
    });

    describe("4. Table Header & Column Alignment (Figma Frame 57)", () => {
        it("renders table within responsive horizontal scroll container", () => {
            expect(pageCode).toContain('className="razorpay-table-scroll"');
            expect(cssCode).toContain(".razorpay-table-scroll {");
            expect(cssCode).toContain("overflow-x: auto;");
        });

        it("applies #E4ECFB header background with 36px height", () => {
            expect(cssCode).toContain(".razorpay-table thead tr {");
            expect(cssCode).toContain("background: #E4ECFB;");
            expect(cssCode).toContain("height: 36px;");
        });

        it("contains all 10 columns specified in Figma Frame 57", () => {
            expect(pageCode).toContain('<th className="th-id">ID</th>');
            expect(pageCode).toContain('<th className="th-project">PROJECT</th>');
            expect(pageCode).toContain('<th className="th-boq">BOQ</th>');
            expect(pageCode).toContain('<th className="th-invoice">INVOICE</th>');
            expect(pageCode).toContain('<th className="th-amount">AMOUNT</th>');
            expect(pageCode).toContain('<th className="th-client">BY CLIENT</th>');
            expect(pageCode).toContain('<th className="th-method">METHOD</th>');
            expect(pageCode).toContain('<th className="th-timestamp">TIMESTAMP</th>');
            expect(pageCode).toContain('<th className="th-status">STATUS</th>');
            expect(pageCode).toContain('<th className="th-actions"></th>');
        });

        it("defines proportionate column widths for clean distribution", () => {
            expect(cssCode).toContain(".razorpay-all-table .th-id, .razorpay-all-table .cell-id");
            expect(cssCode).toContain(".razorpay-all-table .th-project, .razorpay-all-table .cell-project");
            expect(cssCode).toContain(".razorpay-all-table .th-boq, .razorpay-all-table .cell-boq");
            expect(cssCode).toContain(".razorpay-all-table .th-invoice, .razorpay-all-table .cell-invoice");
            expect(cssCode).toContain(".razorpay-all-table .th-amount, .razorpay-all-table .cell-amount");
            expect(cssCode).toContain(".razorpay-all-table .th-client, .razorpay-all-table .cell-client");
            expect(cssCode).toContain(".razorpay-all-table .th-method, .razorpay-all-table .cell-method");
            expect(cssCode).toContain(".razorpay-all-table .th-timestamp, .razorpay-all-table .cell-timestamp");
            expect(cssCode).toContain(".razorpay-all-table .th-status, .razorpay-all-table .cell-status");
            expect(cssCode).toContain(".razorpay-all-table .th-actions, .razorpay-all-table .cell-actions");
        });
    });

    describe("5. Table Rows, Cell Alignment & Figma Design Details", () => {
        it("configures 56px row height and #EBEBEB row divider", () => {
            expect(cssCode).toContain(".razorpay-table-row {");
            expect(cssCode).toContain("height: 56px;");
            expect(cssCode).toContain("border-bottom: 1px solid #EBEBEB;");
        });

        it("renders ID with blue accent (#2563EB) in 'Urbanist' font", () => {
            expect(pageCode).toContain('className="razorpay-id-text"');
            expect(cssCode).toContain(".razorpay-all-table .razorpay-id-text {");
            expect(cssCode).toContain("color: #2563EB;");
        });

        it("renders PROJECT as 2-line vertical stack (Title 14px 500, Code 12px 400)", () => {
            expect(pageCode).toContain('className="razorpay-project-stack"');
            expect(pageCode).toContain('className="project-title"');
            expect(pageCode).toContain('className="project-sub"');

            expect(cssCode).toContain(".project-title {");
            expect(cssCode).toContain("font-weight: 500;");
            expect(cssCode).toContain("color: #0F172A;");

            expect(cssCode).toContain(".project-sub {");
            expect(cssCode).toContain("font-size: 12px;");
            expect(cssCode).toContain("color: #64748B;");
        });

        it("renders BY CLIENT with 24x24 rounded avatar (#D9D9D9) and client name", () => {
            expect(pageCode).toContain('className="razorpay-client-wrap"');
            expect(pageCode).toContain('className="razorpay-client-avatar"');
            expect(pageCode).toContain('className="client-name"');

            expect(cssCode).toContain(".razorpay-client-avatar {");
            expect(cssCode).toContain("width: 24px;");
            expect(cssCode).toContain("height: 24px;");
            expect(cssCode).toContain("background: #D9D9D9;");
        });

        it("renders METHOD as pill badge with distinctive method colors", () => {
            expect(pageCode).toContain('className={`razorpay-method-badge ${getMethodClass(row.method)}`}');
            expect(cssCode).toContain(".razorpay-method-badge {");
            expect(cssCode).toContain("border-radius: 9999px;");
            expect(cssCode).toContain(".method-card {");
            expect(cssCode).toContain(".method-upi {");
            expect(cssCode).toContain(".method-netbanking {");
            expect(cssCode).toContain(".method-wallet {");
        });

        it("renders TIMESTAMP as 2-line vertical stack with date and time", () => {
            expect(pageCode).toContain('className="timestamp-stack"');
            expect(pageCode).toContain('className="timestamp-date"');
            expect(pageCode).toContain('className="timestamp-time"');

            expect(cssCode).toContain(".timestamp-stack {");
            expect(cssCode).toContain(".timestamp-date {");
            expect(cssCode).toContain(".timestamp-time {");
        });

        it("renders STATUS as pill chip with SUCCESS, PENDING, or FAILED", () => {
            expect(pageCode).toContain('className={`razorpay-status-chip ${statusChipClass[mappedStatus] || \'chip-pending\'}`}');
            expect(cssCode).toContain(".razorpay-status-chip {");
            expect(cssCode).toContain("border-radius: 9999px;");
            expect(cssCode).toContain(".chip-successful {");
            expect(cssCode).toContain(".chip-pending {");
            expect(cssCode).toContain(".chip-failed {");
        });

        it("renders ACTIONS column with 3-dots button", () => {
            expect(pageCode).toContain('className="razorpay-action-btn"');
            expect(cssCode).toContain(".razorpay-action-btn {");
        });
    });

    describe("6. Pagination Matching Figma Frame 2147225166", () => {
        it("uses Pagination component with totalLabel='Total Transactions'", () => {
            expect(pageCode).toContain("<Pagination");
            expect(pageCode).toContain('totalLabel="Total Transactions"');
            expect(pageCode).toContain("currentPage={page}");
            expect(pageCode).toContain("totalPages={totalPages}");
            expect(pageCode).toContain("totalItems={total}");
            expect(pageCode).toContain("itemsPerPage={pageSize}");
            expect(pageCode).toContain("onPageChange={setPage}");
            expect(pageCode).toContain("onItemsPerPageChange={setPageSize}");
        });

        it("implements Figma pagination controls with 34x34px buttons and items per page selector", () => {
            expect(paginationCode).toContain('className="custom-form-pagination intg-pagination"');
            expect(paginationCode).toContain("custom-form-page-btn");
            expect(paginationCode).toContain("custom-form-per-page-select");
        });
    });

    describe("7. Dynamic Backend API Integration & Search/Filter Queries", () => {
        it("integrationsApi.transactions client accepts search, status, and method params", () => {
            expect(apiLibCode).toContain("transactions: (integrationId: string, params?: {");
            expect(apiLibCode).toContain("search?: string");
            expect(apiLibCode).toContain("status?: string");
            expect(apiLibCode).toContain("method?: string");
            expect(apiLibCode).toContain("page?: number");
            expect(apiLibCode).toContain("pageSize?: number");
        });

        it("backend API route /api/v1/integrations/:id/transactions handles search, status, and method filters", () => {
            expect(apiRouteCode).toContain("integrationTransactions(");
            expect(apiRouteCode).toContain('request.nextUrl.searchParams.get("status")');
            expect(apiRouteCode).toContain('request.nextUrl.searchParams.get("method")');
            expect(apiRouteCode).toContain('request.nextUrl.searchParams.get("search")');
        });

        it("provides empty state handling for both zero items and zero filter matches", () => {
            expect(pageCode).toContain("No transactions match your search or filter criteria.");
            expect(pageCode).toContain("No transactions found for this Razorpay integration.");
            expect(pageCode).toContain('className="razorpay-empty-state"');
        });
    });
});
