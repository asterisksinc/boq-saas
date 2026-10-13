"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Grid2X2, List, Plus } from "lucide-react";
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
import DeleteModal from "./DeleteModal";

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
    const [modal, setModal] = useState<
        "folder" | "upload" | "delete-folder" | "delete-document" | null
    >(null);
    const [menuId, setMenuId] = useState<string | null>(null);
    const [targetDocument, setTargetDocument] = useState<DocumentItem | null>(null);
    const [targetFolder, setTargetFolder] = useState<FolderItem | null>(null);

    const loadFoldersAndDocs = useCallback(async (targetFolderId: string | null) => {
        setLoading(true);
        setError("");
        try {
            // Load root folders
            const foldersResult = await apiJson<{ items: FolderItem[] }>("/api/v1/document-folders");
            setFolders(foldersResult.items);

            let currentFolderObj: FolderItem | null = null;
            if (targetFolderId) {
                currentFolderObj = foldersResult.items.find((f) => f.id === targetFolderId) || null;
                // If not found in root, try fetching child folders
                if (!currentFolderObj) {
                    try {
                        const childFolders = await apiJson<{ items: FolderItem[] }>(
                            `/api/v1/document-folders?parentId=${targetFolderId}`,
                        );
                        // Also check if current folder can be found
                        currentFolderObj = childFolders.items.find((f) => f.id === targetFolderId) || null;
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
                setDocuments(docsResult.items);
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

    // Close action popup when clicking anywhere outside
    useEffect(() => {
        const handleOutsideClick = () => setMenuId(null);
        window.addEventListener("click", handleOutsideClick);
        return () => window.removeEventListener("click", handleOutsideClick);
    }, []);

    const navigateToFolder = (folder: FolderItem | null) => {
        setActiveFolder(folder);
        setMenuId(null);
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

    // Client-side real-time filter across folder names
    const filteredFolders = useMemo(() => {
        if (!search.trim()) return folders;
        const q = search.trim().toLowerCase();
        return folders.filter((f) => f.name.toLowerCase().includes(q));
    }, [folders, search]);

    // Client-side real-time filter across document names & project names
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
            <div className="fig-dashboard-glow" />
            {rail}
            <div className="fig-dashboard-main">
                <DashboardHeader
                    title="Documents"
                    onNew={() => setModal(activeFolder ? "upload" : "folder")}
                    onSearch={setSearch}
                />

                <section className="documents-content">
                    <div className="documents-toolbar-row">
                        <label className="fig-dashboard-search documents-search-input">
                            <img src="/assets/dashboard/dashboard-search.svg" alt="" />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search files..."
                                aria-label="Search files"
                            />
                        </label>
                        <div className="documents-view-toggle">
                            <button
                                type="button"
                                className={view === "list" ? "active" : ""}
                                onClick={() => setView("list")}
                                aria-label="List view"
                                title="List view"
                            >
                                <List size={18} />
                            </button>
                            <button
                                type="button"
                                className={view === "grid" ? "active" : ""}
                                onClick={() => setView("grid")}
                                aria-label="Grid view"
                                title="Grid view"
                            >
                                <Grid2X2 size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="documents-subbar">
                        {activeFolder ? (
                            <div className="documents-breadcrumb">
                                <button type="button" onClick={goRoot}>
                                    All Folders
                                </button>
                                <span>›</span>
                                <strong>{activeFolder.name}</strong>
                            </div>
                        ) : (
                            <h2 className="documents-section-title">All Folders</h2>
                        )}
                        <div className="documents-actions">
                            <button
                                type="button"
                                className="documents-ghost"
                                onClick={() => setModal("upload")}
                            >
                                Upload
                            </button>
                            <button
                                type="button"
                                className="documents-primary"
                                onClick={() => setModal("folder")}
                            >
                                <Plus size={16} /> New Folder
                            </button>
                        </div>
                    </div>

                    {activeFolder && (
                        <div className="folder-banner">
                            <FolderFileIcon />
                            <div>
                                <strong>{activeFolder.name}</strong>
                                <small>
                                    {activeFolder.itemCount} items |{" "}
                                    {formatSize(activeFolder.sizeBytes)}
                                </small>
                            </div>
                            <time>Last Modified - {formatDate(activeFolder.updatedAt)}</time>
                        </div>
                    )}

                    {error && (
                        <div className="documents-error" role="alert">
                            <span>{error}</span>
                            <button
                                type="button"
                                onClick={() => void loadFoldersAndDocs(activeFolder?.id ?? null)}
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {loading ? (
                        <div className="documents-loading-card">
                            <div className="documents-spinner" />
                            <p>Loading documents…</p>
                        </div>
                    ) : activeFolder ? (
                        <DocumentList
                            documents={filteredDocuments}
                            view={view}
                            onMenu={(id) => setMenuId(menuId === id ? null : id)}
                            menuId={menuId}
                            onDelete={(document) => {
                                setTargetDocument(document);
                                setModal("delete-document");
                                setMenuId(null);
                            }}
                            onUpload={() => setModal("upload")}
                        />
                    ) : (
                        <FolderList
                            folders={filteredFolders}
                            view={view}
                            onOpen={navigateToFolder}
                            onMenu={(id) => setMenuId(menuId === id ? null : id)}
                            menuId={menuId}
                            onDelete={(folder) => {
                                setTargetFolder(folder);
                                setModal("delete-folder");
                                setMenuId(null);
                            }}
                            onCreateFolder={() => setModal("folder")}
                        />
                    )}
                </section>

                {modal === "folder" && (
                    <FolderModal
                        onClose={() => setModal(null)}
                        onCreated={() => {
                            setModal(null);
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
                        onUploaded={() => {
                            setModal(null);
                            void loadFoldersAndDocs(activeFolder?.id ?? null);
                        }}
                    />
                )}

                {modal === "delete-folder" && targetFolder && (
                    <DeleteModal
                        title="Delete Folder?"
                        description={`This will permanently delete “${targetFolder.name}” including all files inside this folder. This action cannot be undone.`}
                        label={targetFolder.name}
                        info={`${targetFolder.itemCount} items | ${formatSize(targetFolder.sizeBytes)}`}
                        onClose={() => setModal(null)}
                        onDelete={async () => {
                            await apiJson(`/api/v1/document-folders/${targetFolder.id}`, {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ confirmation: targetFolder.name }),
                            });
                            setModal(null);
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
                        info={`${targetDocument.projectName || "General"} | ${formatSize(targetDocument.sizeBytes)}`}
                        onClose={() => setModal(null)}
                        onDelete={async () => {
                            await apiJson(`/api/v1/documents/${targetDocument.id}`, {
                                method: "DELETE",
                            });
                            setModal(null);
                            void loadFoldersAndDocs(activeFolder?.id ?? null);
                        }}
                    />
                )}
            </div>
        </main>
    );
}
