export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";

export function permissionsFor(role: string) {
  const elevated = role === "owner" || role === "admin";
  const contributor = elevated || role === "member";
  return {
    canCreateProject: contributor,
    canCreateBoq: contributor,
    canViewFinancials: elevated,
    canApprove: elevated,
    canExport: contributor,
    canCreateProposal: contributor,
    canManageDocuments: contributor,
    canArchiveProposal: elevated,
    canDeleteDocuments: elevated,
    canCreateInvoice: contributor,
    canRecordPayment: contributor,
    canDeleteInvoice: elevated,
    canManageBoq: contributor,
    canManageCosting: contributor,
    canViewReports: elevated,
    canExportReports: elevated,
  };
}
