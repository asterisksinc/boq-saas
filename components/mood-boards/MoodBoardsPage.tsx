"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import { MoodBoard, MoodBoardFilterState, CreateMoodBoardInput, UpdateMoodBoardInput } from "@/lib/mood-boards/types";
import { filterMoodBoards } from "@/lib/mood-boards/helpers";
import { moodBoardRepository } from "@/lib/mood-boards/repository";
import { downloadMoodBoardPdf } from "@/lib/mood-boards/export-service";
import MoodBoardToolbar from "./MoodBoardToolbar";
import MoodBoardTable from "./MoodBoardTable";
import MoodBoardGrid from "./MoodBoardGrid";
import MoodBoardPagination from "./MoodBoardPagination";
import MoodBoardEmptyState from "./MoodBoardEmptyState";
import MoodBoardFilterPopover from "./MoodBoardFilterPopover";
import NewMoodBoardModal, { CreationMode } from "./NewMoodBoardModal";
import MoodBoardSuccessModal from "./MoodBoardSuccessModal";
import CreateMoodBoardModal from "./CreateMoodBoardModal";
import EditMoodBoardModal from "./EditMoodBoardModal";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import MoodBoardImportDialog from "./MoodBoardImportDialog";
import "@/app/mood-boards/mood-boards.css";

const VIEW_PREF_KEY = "boq-saas:mood-boards:view-mode";

const INITIAL_FILTERS: MoodBoardFilterState = {
  status: "ALL",
  projectId: "ALL",
  clientId: "ALL",
  createdBy: "ALL",
  search: "",
};

interface ToastState {
  message: string;
  type: "success" | "error";
}

interface MoodBoardsPageProps {
  rail: React.ReactNode;
}

export default function MoodBoardsPage({ rail }: MoodBoardsPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createdId = searchParams ? searchParams.get("created") : null;

  // Core data states
  const [moodBoards, setMoodBoards] = useState<MoodBoard[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter states
  const [filters, setFilters] = useState<MoodBoardFilterState>(INITIAL_FILTERS);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // View mode (list / grid)
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<MoodBoard | null>(null);
  const [deletingBoard, setDeletingBoard] = useState<MoodBoard | null>(null);
  const [successBoard, setSuccessBoard] = useState<MoodBoard | null>(null);

  // Toast notification
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((cur) => (cur?.message === message ? null : cur));
    }, 3500);
  }, []);

  // Load view mode preference from localStorage
  useEffect(() => {
    try {
      const savedView = window.localStorage.getItem(VIEW_PREF_KEY);
      if (savedView === "grid" || savedView === "list") {
        setViewMode(savedView);
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleViewModeChange = (mode: "list" | "grid") => {
    setViewMode(mode);
    try {
      window.localStorage.setItem(VIEW_PREF_KEY, mode);
    } catch {
      // Ignore
    }
  };

  // Load data from repository
  const refreshData = useCallback(async () => {
    try {
      const data = await moodBoardRepository.getAll();
      setMoodBoards(data);
    } catch (err) {
      console.error("Failed to load mood boards:", err);
      showToast("Failed to load mood boards.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Listen to external updates if any
  useEffect(() => {
    const handleUpdate = () => refreshData();
    window.addEventListener("boq-moodboards-updated", handleUpdate);
    return () => window.removeEventListener("boq-moodboards-updated", handleUpdate);
  }, [refreshData]);

  // Monitor created query parameter to trigger success modal (Figma Spec /* Mood Board - Completed + DOwnload */)
  useEffect(() => {
    if (!createdId) return;

    const matched = moodBoards.find((b) => b.id === createdId);
    if (matched) {
      setSuccessBoard(matched);
    } else {
      moodBoardRepository.getById(createdId).then((board) => {
        if (board) {
          setSuccessBoard(board);
        }
      });
    }
  }, [createdId, moodBoards]);

  const handleCloseSuccess = () => {
    setSuccessBoard(null);
    router.replace("/mood-boards");
  };

  // Derived counts for heading summary
  const totalBoardsCount = moodBoards.length;
  const uniqueProjectsCount = useMemo(() => {
    const set = new Set(moodBoards.map((b) => b.projectId));
    return set.size;
  }, [moodBoards]);

  // Filtered mood boards
  const filteredBoards = useMemo(() => {
    return filterMoodBoards(moodBoards, filters);
  }, [moodBoards, filters]);

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Paginated records
  const paginatedBoards = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredBoards.slice(startIndex, startIndex + pageSize);
  }, [filteredBoards, currentPage, pageSize]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status && filters.status !== "ALL") count++;
    if (filters.projectId && filters.projectId !== "ALL") count++;
    if (filters.clientId && filters.clientId !== "ALL") count++;
    if (filters.createdBy && filters.createdBy !== "ALL") count++;
    return count;
  }, [filters]);

  // Handlers
  const handleView = (id: string) => {
    router.push(`/mood-boards/${id}`);
  };

  const handleCreateSubmit = async (input: CreateMoodBoardInput) => {
    try {
      const created = await moodBoardRepository.create(input);
      await refreshData();
      setIsCreateOpen(false);
      showToast(`Mood Board "${created.name}" created successfully.`);
    } catch (err) {
      console.error(err);
      showToast("Failed to create mood board.", "error");
    }
  };

  const handleCreationModeContinue = (mode: CreationMode) => {
    setIsCreateOpen(false);
    router.push(`/mood-boards/new?mode=${mode}`);
  };

  const handleEditSubmit = async (id: string, input: UpdateMoodBoardInput) => {
    try {
      const updated = await moodBoardRepository.update(id, input);
      await refreshData();
      setEditingBoard(null);
      showToast(`Mood Board "${updated.name}" updated successfully.`);
    } catch (err) {
      console.error(err);
      showToast("Failed to update mood board.", "error");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const duplicated = await moodBoardRepository.duplicate(id);
      await refreshData();
      showToast(`Mood Board duplicated as "${duplicated.name}".`);
    } catch (err) {
      console.error(err);
      showToast("Failed to duplicate mood board.", "error");
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const target = moodBoards.find((b) => b.id === id);
      if (!target) return;
      const newStatus = target.status === "ARCHIVED" ? "DRAFT" : "ARCHIVED";
      await moodBoardRepository.update(id, { status: newStatus });
      await refreshData();
      showToast(
        newStatus === "ARCHIVED"
          ? `Mood Board "${target.name}" archived.`
          : `Mood Board "${target.name}" restored.`
      );
    } catch (err) {
      console.error(err);
      showToast("Failed to update mood board status.", "error");
    }
  };

  const handleDeleteConfirm = async (id: string) => {
    try {
      const target = moodBoards.find((b) => b.id === id);
      await moodBoardRepository.delete(id);
      await refreshData();
      setDeletingBoard(null);
      showToast(`Mood Board "${target?.name || "Item"}" deleted.`);
    } catch (err) {
      console.error(err);
      showToast("Failed to delete mood board.", "error");
    }
  };

  const handleBatchImport = async (count: number, items: CreateMoodBoardInput[]) => {
    try {
      for (const item of items) {
        await moodBoardRepository.create(item);
      }
      await refreshData();
      showToast(`Successfully imported ${count} ${count === 1 ? "mood board" : "mood boards"}.`);
    } catch (err) {
      console.error(err);
      showToast("Failed to import some mood boards.", "error");
    }
  };

  const handleDownloadBoard = async (board: MoodBoard) => {
    try {
      await downloadMoodBoardPdf(board);
      showToast(`Downloaded "${board.name}" PDF.`);
    } catch (err) {
      console.error(err);
      showToast("Failed to download mood board PDF.", "error");
    }
  };

  return (
    <main className="fig-dashboard mood-boards-page">
      <div className="fig-dashboard-glow mood-boards-bg-glow" />
      {rail}

      <div className="fig-dashboard-main">
        {/* Global Dashboard Header (Frame 76) */}
        <DashboardHeader
          title="Mood Board"
          onNew={() => setIsCreateOpen(true)}
          onSearch={(query) => setFilters((prev) => ({ ...prev, search: query }))}
        />

        <div className="mood-boards-container">
          {/* Page Sub-Heading & Summary (Frame 2147225068) */}
          <section className="mb-header-row" aria-label="Mood Board Summary">
            <div className="mb-header-titles">
              <h1 className="mb-title">Mood Boards</h1>
              <p className="mb-subtitle">
                {totalBoardsCount} Mood Boards | Across {uniqueProjectsCount} Projects in Total
              </p>
            </div>

            <div className="mb-header-actions">
              <button
                type="button"
                className="mb-btn mb-btn-secondary"
                onClick={() => setIsImportOpen(true)}
                aria-label="Import Excel"
              >
                <FileSpreadsheet size={16} />
                <span>Import Excel</span>
              </button>

              <button
                type="button"
                className="mb-btn mb-btn-primary"
                onClick={() => setIsCreateOpen(true)}
                aria-label="New Mood Board"
              >
                <Plus size={16} />
                <span>New Mood Board</span>
              </button>
            </div>
          </section>

          {/* Toolbar (Frame 2147225067) */}
          <section style={{ position: "relative" }} aria-label="Search and filters">
            <MoodBoardToolbar
              searchQuery={filters.search}
              onSearchChange={(q) => setFilters((prev) => ({ ...prev, search: q }))}
              activeFilterCount={activeFilterCount}
              onToggleFilter={() => setIsFilterOpen((prev) => !prev)}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
            />

            {/* Filter Popover */}
            <MoodBoardFilterPopover
              isOpen={isFilterOpen}
              onClose={() => setIsFilterOpen(false)}
              filters={filters}
              onApply={(newFilters) => setFilters(newFilters)}
              onReset={() => setFilters(INITIAL_FILTERS)}
            />
          </section>

          {/* Main Surface (Frame 2147225139) */}
          <section className="mood-board-table-surface" aria-label="Mood Boards Display">
            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: "#64748B" }}>
                Loading mood boards...
              </div>
            ) : filteredBoards.length === 0 ? (
              <MoodBoardEmptyState
                isFiltered={Boolean(filters.search.trim() || activeFilterCount > 0)}
                onResetFilters={() => setFilters(INITIAL_FILTERS)}
                onCreateNew={() => setIsCreateOpen(true)}
              />
            ) : viewMode === "list" ? (
              <>
                <MoodBoardTable
                  moodBoards={paginatedBoards}
                  onView={handleView}
                  onEdit={(mb) => setEditingBoard(mb)}
                  onDuplicate={handleDuplicate}
                  onArchive={handleArchive}
                  onDelete={(mb) => setDeletingBoard(mb)}
                  onDownload={handleDownloadBoard}
                />
                <MoodBoardPagination
                  currentPage={currentPage}
                  totalItems={filteredBoards.length}
                  pageSize={pageSize}
                  onPageChange={(p) => setCurrentPage(p)}
                  onPageSizeChange={(s) => {
                    setPageSize(s);
                    setCurrentPage(1);
                  }}
                />
              </>
            ) : (
              <>
                <MoodBoardGrid
                  moodBoards={paginatedBoards}
                  onView={handleView}
                  onEdit={(mb) => setEditingBoard(mb)}
                  onDuplicate={handleDuplicate}
                  onArchive={handleArchive}
                  onDelete={(mb) => setDeletingBoard(mb)}
                  onDownload={handleDownloadBoard}
                />
                <MoodBoardPagination
                  currentPage={currentPage}
                  totalItems={filteredBoards.length}
                  pageSize={pageSize}
                  onPageChange={(p) => setCurrentPage(p)}
                  onPageSizeChange={(s) => {
                    setPageSize(s);
                    setCurrentPage(1);
                  }}
                />
              </>
            )}
          </section>
        </div>
      </div>

      {/* Success Confirmation Modal (Figma Spec Frame 2147225094 / Completed + Download) */}
      <MoodBoardSuccessModal
        isOpen={Boolean(successBoard)}
        moodBoard={successBoard}
        onClose={handleCloseSuccess}
      />

      {/* New Mood Board Modal (Figma Spec Frame 2147225092) */}
      <NewMoodBoardModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onContinue={handleCreationModeContinue}
      />

      {/* Edit Modal */}
      <EditMoodBoardModal
        isOpen={Boolean(editingBoard)}
        moodBoard={editingBoard}
        onClose={() => setEditingBoard(null)}
        onSubmit={handleEditSubmit}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmDialog
        isOpen={Boolean(deletingBoard)}
        moodBoard={deletingBoard}
        onClose={() => setDeletingBoard(null)}
        onConfirm={handleDeleteConfirm}
      />

      {/* Excel Import Dialog */}
      <MoodBoardImportDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={handleBatchImport}
      />

      {/* Toast Feedback Banner */}
      {toast && (
        <div className="mb-toast" role="status" aria-live="polite">
          {toast.type === "success" ? (
            <CheckCircle2 size={18} className="mb-toast-success-icon" />
          ) : (
            <AlertCircle size={18} className="mb-toast-error-icon" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </main>
  );
}
