"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, Grid2X2, List, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardHeader from "@/components/DashboardHeader";
import { getApiErrorMessage, parseApiResponse } from "@/lib/api/auth";
import {
    DocumentItem,
    FolderItem,
    formatDate,
    formatSize,
} from "./types";
import { FolderFileIcon } from "./FolderFileIcon";
import FolderList from "./FolderList";
import DocumentList from "./DocumentList";
import FolderModal from "./FolderModal";
import UploadModal from "./UploadModal";
import RenameModal from "./RenameModal";
import DeleteModal from "./DeleteModal";
import "@/app/documents/documents-redesign.css";

export interface DocumentsViewProps {
    rail: React.ReactNode;
    isClient?: boolean;
}

async function apiJson<T>(url: string, init?: RequestInit) {
    const response = await fetch(url, {
        ...init,
        credentials: "include",
        cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(getApiErrorMessage(payload));
    return parseApiResponse<T>(payload);
}

export default function DocumentsView({ rail, isClient = false }: DocumentsViewProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const folderParam = searchParams?.get("folder") || null;

    const [folders, setFolders] = useState<FolderItem[]>([]);
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [activeFolder, setActiveFolder] = useState<FolderItem | null>(null);
    const [view, setView] = useState<"list" | "grid">("list");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Modal state
    const [modal, setModal] = useState<
        "folder" | "upload" | "rename-folder" | "rename-document" | "delete-folder" | "delete-document" | null
    >(null);
    const [menuId, setMenuId] = useState<string | null>(null);
    const [targetDocument, setTargetDocument] = useState<DocumentItem | null>(null);
    const [targetFolder, setTargetFolder] = useState<FolderItem | null>(null);

    // Toast helper
    const showToast = useCallback((msg: string) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage((current) => (current === msg ? null : current));
        }, 3000);
    }, []);

    // Load folders & documents
    const loadFoldersAndDocs = useCallback(async (targetFolderId: string | null) => {
        setLoading(true);
        setError("");
        try {
            // Load root folders
            const foldersResult = await apiJson<{ items: FolderItem[] }>("/api/v1/document-folders");
            setFolders(foldersResult.items || []);

            let currentFolderObj: FolderItem | null = null;
            if (targetFolderId) {
                currentFolderObj = (foldersResult.items || []).find((f) => f.id === targetFolderId) || null;
                // If not found in root, try fetching child folders
                if (!currentFolderObj) {
                    try {
                        const childFolders = await apiJson<{ items: FolderItem[] }>(
                            `/api/v1/document-folders?parentId=${targetFolderId}`,
                        );
                        currentFolderObj = (childFolders.items || []).find((f) => f.id === targetFolderId) || null;
                    } catch {
                        // ignore
                    }
                }
            }

            setActiveFolder(currentFolderObj);

            if (targetFolderId) {
                const docsResult = await apiJson<{ items: DocumentItem[] }>(
                    `/api/v1/documents?folderId=${targetFolderId}&page=1&pageSize=100`,
                );
                setDocuments(docsResult.items || []);
            } else {
                setDocuments([]);
            }
        } catch (loadError) {
            setError(getApiErrorMessage(loadError));
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load and whenever folder query param changes
    useEffect(() => {
        void loadFoldersAndDocs(folderParam);
    }, [folderParam, loadFoldersAndDocs]);

    // Close action menu when clicking anywhere outside or pressing Escape
    useEffect(() => {
        const handleOutsideClick = () => setMenuId(null);
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMenuId(null);
        };
        window.addEventListener("click", handleOutsideClick);
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("click", handleOutsideClick);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    const navigateToFolder = (folder: FolderItem | null) => {
        setActiveFolder(folder);
        setMenuId(null);
        setSearch("");
        const basePath = isClient ? "/client/documents" : "/documents";
        if (folder) {
            router.push(`${basePath}?folder=${folder.id}`);
        } else {
            router.push(basePath);
        }
    };

    const goRoot = () => {
        navigateToFolder(null);
    };

    // Filter across folder names
    const filteredFolders = useMemo(() => {
        if (!search.trim()) return folders;
        const q = search.trim().toLowerCase();
        return folders.filter((f) => f.name.toLowerCase().includes(q));
    }, [folders, search]);

    // Filter across document names & project names
    const filteredDocuments = useMemo(() => {
        if (!search.trim()) return documents;
        const q = search.trim().toLowerCase();
        return documents.filter(
            (d) =>
                d.name.toLowerCase().includes(q) ||
                (d.projectName && d.projectName.toLowerCase().includes(q)),
        );
    }, [documents, search]);

    return (
        <main className="fig-dashboard documents-page">
            <div className="fig-dashboard-glow documents-bg-glow" />
            {rail}

            <div className="fig-dashboard-main">
                {/* Global Dashboard Header */}
                <DashboardHeader
                    title="Documents"
                    onNew={() => setModal(activeFolder ? "upload" : "folder")}
                    onSearch={(query) => setSearch(query)}
                />

                {/* Toast Notification */}
                {toastMessage && (
                    <div className="doc-toast" role="status" aria-live="polite">
                        <Check size={18} color="#22C55E" />
                        <span>{toastMessage}</span>
                    </div>
                )}

                {/* Module Layout Area (Frame 2147225065) */}
                <section className="doc-main-container documents-content">
                    {/* Error Banner */}
                    {error && (
                        <div className="doc-error-banner" role="alert">
                            <span>{error}</span>
                            <button
                                type="button"
                                onClick={() => void loadFoldersAndDocs(activeFolder?.id ?? null)}
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {/* Toolbar Row (Frame 2147225067) */}
                    <div className="doc-toolbar-row">
                        {/* Search files... (Frame 76) */}
                        <div className="doc-search-box">
                            <div className="doc-search-icon-box" aria-hidden="true">
                                <Search size={16} />
                            </div>
                            <input
                                className="doc-search-input"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search files..."
                                aria-label="Search files"
                            />
                        </div>

                        {/* View Toggle (Buttons) */}
                        <div
                            className="doc-view-toggle documents-view-toggle"
                            role="tablist"
                            aria-label="View toggle"
                        >
                            <button
                                type="button"
                                className={`doc-view-btn ${view === "list" ? "active" : ""}`}
                                onClick={() => setView("list")}
                                aria-label="List view"
                                title="List view"
                                role="tab"
                                aria-selected={view === "list"}
                            >
                                <List size={18} />
                            </button>
                            <button
                                type="button"
                                className={`doc-view-btn ${view === "grid" ? "active" : ""}`}
                                onClick={() => setView("grid")}
                                aria-label="Grid view"
                                title="Grid view"
                                role="tab"
                                aria-selected={view === "grid"}
                            >
                                <Grid2X2 size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Sub-header Row (Frame 2147225066) */}
                    <div className="doc-subbar-row">
                        {/* Heading / Breadcrumb */}
                        <div className="doc-title-group">
                            {activeFolder ? (
                                <nav className="doc-breadcrumbs documents-breadcrumb" aria-label="Breadcrumb">
                                    <button
                                        type="button"
                                        className="doc-breadcrumb-btn"
                                        onClick={goRoot}
                                    >
                                        All Folders
                                    </button>
                                    <ChevronRight size={18} className="doc-breadcrumb-icon" aria-hidden="true" />
                                    <span className="doc-breadcrumb-current" aria-current="page">
                                        {activeFolder.name}
                                    </span>
                                </nav>
                            ) : (
                                <h2 className="doc-title-main">All Folders</h2>
                            )}
                        </div>

                        {/* Action Buttons (Frame 2147225069) */}
                        <div className="doc-actions-group">
                            <button
                                type="button"
                                className="btn-doc-upload"
                                onClick={() => setModal("upload")}
                            >
                                Upload
                            </button>
                            <button
                                type="button"
                                className="btn-doc-new-folder"
                                onClick={() => setModal("folder")}
                            >
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                                    <path d="M10 4.16667V15.8333M4.16667 10H15.8333" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span>New Folder</span>
                            </button>
                        </div>
                    </div>

                    {/* Folder summary card when active (Figma List - Open Folder View) */}
                    {activeFolder && (
                        <div className="doc-folder-summary-card folder-banner doc-folder-banner">
                            <div className="doc-folder-summary-badge" aria-hidden="true">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M2.5 5.83333C2.5 4.91286 3.24619 4.16667 4.16667 4.16667H7.72631C8.16834 4.16667 8.59223 4.34226 8.90479 4.65482L10.2619 6.0119C10.5744 6.32446 10.9983 6.5 11.4404 6.5H15.8333C16.7538 6.5 17.5 7.24619 17.5 8.16667V14.1667C17.5 15.0871 16.7538 15.8333 15.8333 15.8333H4.16667C3.24619 15.8333 2.5 15.0871 2.5 14.1667V5.83333Z" fill="white"/>
                                </svg>
                            </div>
                            <div className="doc-folder-summary-info">
                                <strong className="doc-folder-summary-name" title={activeFolder.name}>
                                    {activeFolder.name}
                                </strong>
                                <span className="doc-folder-summary-meta">
                                    {activeFolder.itemCount === 1 ? "1 item" : `${activeFolder.itemCount} items`}
                                    {activeFolder.sizeBytes > 0 ? ` | ${formatSize(activeFolder.sizeBytes)}` : ""}
                                </span>
                            </div>
                            <time className="doc-folder-summary-date">
                                Last Modified - {formatDate(activeFolder.updatedAt)}
                            </time>
                        </div>
                    )}

                    {/* Table Surface Card (Frame 2147225139) */}
                    <div className={`doc-table-card ${view === "grid" ? "grid-mode" : ""}`}>
                        {loading ? (
                            <div className="doc-loading-container">
                                <div className="doc-spinner" />
                                <p>Loading documents…</p>
                            </div>
                        ) : activeFolder ? (
                            <DocumentList
                                documents={filteredDocuments}
                                view={view}
                                onMenu={(id) => setMenuId(menuId === id ? null : id)}
                                menuId={menuId}
                                onRename={(document) => {
                                    setTargetDocument(document);
                                    setModal("rename-document");
                                    setMenuId(null);
                                }}
                                onDelete={(document) => {
                                    setTargetDocument(document);
                                    setModal("delete-document");
                                    setMenuId(null);
                                }}
                                onUpload={() => setModal("upload")}
                                searchQuery={search}
                            />
                        ) : (
                            <FolderList
                                folders={filteredFolders}
                                view={view}
                                onOpen={navigateToFolder}
                                onMenu={(id) => setMenuId(menuId === id ? null : id)}
                                menuId={menuId}
                                onRename={(folder) => {
                                    setTargetFolder(folder);
                                    setModal("rename-folder");
                                    setMenuId(null);
                                }}
                                onDelete={(folder) => {
                                    setTargetFolder(folder);
                                    setModal("delete-folder");
                                    setMenuId(null);
                                }}
                                onCreateFolder={() => setModal("folder")}
                                searchQuery={search}
                            />
                        )}
                    </div>
                </section>

                {/* Modals */}
                {modal === "folder" && (
                    <FolderModal
                        onClose={() => setModal(null)}
                        onCreated={(name) => {
                            setModal(null);
                            showToast(`Folder “${name}” created successfully`);
                            void loadFoldersAndDocs(activeFolder?.id ?? null);
                        }}
                        parentId={activeFolder?.id ?? null}
                    />
                )}

                {modal === "upload" && (
                    <UploadModal
                        folders={activeFolder ? [activeFolder] : folders}
                        selectedFolder={activeFolder}
                        onClose={() => setModal(null)}
                        onUploaded={(count) => {
                            setModal(null);
                            showToast(`${count} ${count === 1 ? "file" : "files"} uploaded successfully`);
                            void loadFoldersAndDocs(activeFolder?.id ?? null);
                        }}
                    />
                )}

                {modal === "rename-folder" && targetFolder && (
                    <RenameModal
                        title="Rename Folder"
                        initialName={targetFolder.name}
                        onClose={() => setModal(null)}
                        onRename={async (newName) => {
                            await apiJson(`/api/v1/document-folders/${targetFolder.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ name: newName }),
                            });
                            showToast(`Folder renamed to “${newName}”`);
                            void loadFoldersAndDocs(activeFolder?.id ?? null);
                        }}
                    />
                )}

                {modal === "rename-document" && targetDocument && (
                    <RenameModal
                        title="Rename File"
                        initialName={targetDocument.name}
                        onClose={() => setModal(null)}
                        onRename={async (newName) => {
                            await apiJson(`/api/v1/documents/${targetDocument.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ name: newName }),
                            });
                            showToast(`File renamed to “${newName}”`);
                            void loadFoldersAndDocs(activeFolder?.id ?? null);
                        }}
                    />
                )}

                {modal === "delete-folder" && targetFolder && (
                    <DeleteModal
                        title="Delete Folder?"
                        description={`This will permanently delete “${targetFolder.name}” including all files inside this folder. This action cannot be undone.`}
                        label={targetFolder.name}
                        info={`${targetFolder.itemCount} items | ${targetFolder.sizeBytes ? `${(targetFolder.sizeBytes / (1024 * 1024)).toFixed(1)} MB` : "0 MB"}`}
                        type="folder"
                        onClose={() => setModal(null)}
                        onDelete={async () => {
                            await apiJson(`/api/v1/document-folders/${targetFolder.id}`, {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ confirmation: targetFolder.name }),
                            });
                            setModal(null);
                            showToast(`Folder “${targetFolder.name}” deleted`);
                            goRoot();
                            void loadFoldersAndDocs(null);
                        }}
                    />
                )}

                {modal === "delete-document" && targetDocument && (
                    <DeleteModal
                        title="Delete File?"
                        description={`This file will be permanently deleted from “${targetDocument.name}”. This action cannot be undone.`}
                        label={targetDocument.name}
                        info={`${targetDocument.projectName || "General"} | ${targetDocument.sizeBytes ? `${(targetDocument.sizeBytes / 1024).toFixed(1)} KB` : "0 KB"}`}
                        type="file"
                        onClose={() => setModal(null)}
                        onDelete={async () => {
                            await apiJson(`/api/v1/documents/${targetDocument.id}`, {
                                method: "DELETE",
                            });
                            setModal(null);
                            showToast(`File “${targetDocument.name}” deleted`);
                            void loadFoldersAndDocs(activeFolder?.id ?? null);
                        }}
                    />
                )}
            </div>
        </main>
    );
}
