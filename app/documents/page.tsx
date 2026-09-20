"use client";

import {
    ChevronDown,
    Eye,
    Grid2X2,
    List,
    MoreHorizontal,
    Plus,
    Trash2,
    Upload,
    X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import DashboardRail from "@/components/DashboardRail";
import { getApiErrorMessage, parseApiResponse } from "@/lib/api/auth";

type FolderItem = {
    id: string;
    parentId: string | null;
    name: string;
    itemCount: number;
    sizeBytes: number;
    updatedAt: string;
};

type DocumentItem = {
    id: string;
    folderId: string;
    projectName: string | null;
    name: string;
    mimeType: string;
    sizeBytes: number;
    updatedAt: string;
};

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

function formatSize(bytes: number) {
    if (!bytes || bytes <= 0) return "0 KB";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDate(value: string) {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "—";
    const day = d.getDate();
    const month = d.toLocaleDateString("en-US", { month: "short" });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
}

// Issue 4: Exact 40x40 SVG symbol specified by the user
function FolderFileIcon({ className = "" }: { className?: string }) {
    return (
        <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`documents-folder-svg ${className}`}
        >
            <rect width="40" height="40" rx="20" fill="#E4ECFB" />
            <path
                d="M12.5 27.5C12.0397 27.5 11.6666 27.1269 11.6666 26.6667V13.3333C11.6666 12.8731 12.0397 12.5 12.5 12.5H18.6785L20.3451 14.1667H26.6666C27.1269 14.1667 27.5 14.5398 27.5 15V17.5H25.8333V15.8333H19.6548L17.9881 14.1667H13.3333V24.165L14.5833 19.1667H28.75L26.8245 26.8687C26.7317 27.2397 26.3984 27.5 26.016 27.5H12.5ZM26.6153 20.8333H15.8846L14.6346 25.8333H25.3653L26.6153 20.8333Z"
                fill="#2563EB"
            />
        </svg>
    );
}

export default function DocumentsPage() {
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

    async function loadFolders() {
        setLoading(true);
        setError("");
        try {
            const result = await apiJson<{ items: FolderItem[] }>(
                `/api/v1/document-folders${activeFolder ? `?parentId=${activeFolder.id}` : ""}`,
            );
            setFolders(result.items);
            if (activeFolder) {
                const docs = await apiJson<{ items: DocumentItem[] }>(
                    `/api/v1/documents?folderId=${activeFolder.id}&page=1&pageSize=100${search ? `&search=${encodeURIComponent(search)}` : ""}`,
                );
                setDocuments(docs.items);
            } else {
                setDocuments([]);
            }
        } catch (loadError) {
            setError(getApiErrorMessage(loadError));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadFolders();
    }, [activeFolder, search]);

    // Close action popup when clicking anywhere outside
    useEffect(() => {
        const handleOutsideClick = () => setMenuId(null);
        window.addEventListener("click", handleOutsideClick);
        return () => window.removeEventListener("click", handleOutsideClick);
    }, []);

    const goRoot = () => {
        setActiveFolder(null);
        setMenuId(null);
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
            <DashboardRail />
            <div className="fig-dashboard-main">
                {/* Issue 1: Header identical to dashboard header */}
                <header className="fig-dashboard-header">
                    <h1>Documents</h1>
                    <div className="fig-dashboard-header-actions">
                        <label className="fig-dashboard-search">
                            <img src="/assets/dashboard/dashboard-search.svg" alt="" />
                            <input
                                placeholder="Search..."
                                aria-label="Search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </label>
                        <button
                            className="fig-dashboard-new"
                            type="button"
                            onClick={() => setModal(activeFolder ? "upload" : "folder")}
                        >
                            <Plus size={20} />
                            <span>New</span>
                            <i />
                            <ChevronDown size={20} />
                        </button>
                        <button
                            className="fig-dashboard-bell"
                            type="button"
                            aria-label="Notifications"
                        >
                            <img src="/assets/dashboard/dashboard-notifications.svg" alt="" />
                        </button>
                        <div className="fig-dashboard-avatar">BO</div>
                    </div>
                </header>

                <section className="documents-content">
                    {/* Issue 2: Secondary search bar matches dashboard search bar UI */}
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
                                <button type="button" onClick={goRoot}>All Folders</button>
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
                            <button type="button" onClick={() => void loadFolders()}>Try again</button>
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
                            onOpen={setActiveFolder}
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
                            void loadFolders();
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
                            void loadFolders();
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
                            void loadFolders();
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
                            void loadFolders();
                        }}
                    />
                )}
            </div>
        </main>
    );
}

// Issue 3: Table columns and headers aligned in same CSS grid columns
function FolderList({
    folders,
    view,
    onOpen,
    onMenu,
    menuId,
    onDelete,
    onCreateFolder,
}: {
    folders: FolderItem[];
    view: "list" | "grid";
    onOpen: (folder: FolderItem) => void;
    onMenu: (id: string) => void;
    menuId: string | null;
    onDelete: (folder: FolderItem) => void;
    onCreateFolder: () => void;
}) {
    if (folders.length === 0) {
        return (
            <div className="documents-empty-state">
                <FolderFileIcon />
                <h3>No folders found</h3>
                <p>Get started by creating your first folder.</p>
                <button type="button" className="documents-primary" onClick={onCreateFolder}>
                    <Plus size={16} /> New Folder
                </button>
            </div>
        );
    }

    if (view === "grid") {
        return (
            <div className="folder-grid-view">
                {folders.map((folder) => (
                    <article
                        className="folder-grid-card"
                        key={folder.id}
                        onDoubleClick={() => onOpen(folder)}
                    >
                        <div className="folder-grid-card-top">
                            <button
                                type="button"
                                className="folder-icon-btn"
                                onClick={() => onOpen(folder)}
                            >
                                <FolderFileIcon />
                            </button>
                            <div className="documents-col-action">
                                <button
                                    type="button"
                                    className="document-menu-button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onMenu(folder.id);
                                    }}
                                    aria-label={`Actions for ${folder.name}`}
                                >
                                    <MoreHorizontal size={18} />
                                </button>
                                {menuId === folder.id && (
                                    <div
                                        className="document-menu"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button type="button" onClick={() => onOpen(folder)}>
                                            <Eye size={15} /> <span>Open Folder</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="danger"
                                            onClick={() => onDelete(folder)}
                                        >
                                            <Trash2 size={15} /> <span>Delete Folder</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="folder-grid-info" onClick={() => onOpen(folder)}>
                            <strong className="folder-grid-name">{folder.name}</strong>
                            <span className="folder-grid-meta">{folder.itemCount} items</span>
                            <div className="folder-grid-footer">
                                <span>{formatSize(folder.sizeBytes)}</span>
                                <time>{formatDate(folder.updatedAt)}</time>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        );
    }

    return (
        <div className="documents-table-wrapper">
            <div className="documents-table-card">
                <div className="documents-table-header">
                    <span className="th-name">NAME</span>
                    <span className="th-items">ITEMS</span>
                    <span className="th-size">SIZE</span>
                    <span className="th-date">LAST MODIFIED</span>
                    <span className="th-action"></span>
                </div>
                <div className="documents-table-body">
                    {folders.map((folder) => (
                        <div
                            className="documents-table-row"
                            key={folder.id}
                            onDoubleClick={() => onOpen(folder)}
                        >
                            <div
                                className="documents-col-name"
                                onClick={() => onOpen(folder)}
                            >
                                <FolderFileIcon />
                                <span className="documents-item-name">{folder.name}</span>
                            </div>
                            <div className="documents-col-items">
                                {folder.itemCount} items
                            </div>
                            <div className="documents-col-size">
                                {formatSize(folder.sizeBytes)}
                            </div>
                            <div className="documents-col-date">
                                {formatDate(folder.updatedAt)}
                            </div>
                            <div className="documents-col-action">
                                <button
                                    type="button"
                                    className="document-menu-button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onMenu(folder.id);
                                    }}
                                    aria-label={`Actions for ${folder.name}`}
                                >
                                    <MoreHorizontal size={18} />
                                </button>
                                {menuId === folder.id && (
                                    <div
                                        className="document-menu"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button type="button" onClick={() => onOpen(folder)}>
                                            <Eye size={15} /> <span>Open Folder</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="danger"
                                            onClick={() => onDelete(folder)}
                                        >
                                            <Trash2 size={15} /> <span>Delete Folder</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function DocumentList({
    documents,
    view,
    onMenu,
    menuId,
    onDelete,
    onUpload,
}: {
    documents: DocumentItem[];
    view: "list" | "grid";
    onMenu: (id: string) => void;
    menuId: string | null;
    onDelete: (document: DocumentItem) => void;
    onUpload: () => void;
}) {
    async function viewDocument(document: DocumentItem) {
        const result = await apiJson<{ url: string }>(
            `/api/v1/documents/${document.id}/download`,
        );
        window.open(result.url, "_blank", "noopener,noreferrer");
    }

    if (documents.length === 0) {
        return (
            <div className="documents-empty-state">
                <FolderFileIcon />
                <h3>No files in this folder</h3>
                <p>Upload documents or assets to organize them here.</p>
                <button type="button" className="documents-primary" onClick={onUpload}>
                    <Upload size={16} /> Upload Files
                </button>
            </div>
        );
    }

    if (view === "grid") {
        return (
            <div className="folder-grid-view">
                {documents.map((doc) => (
                    <article
                        className="folder-grid-card"
                        key={doc.id}
                        onDoubleClick={() => void viewDocument(doc)}
                    >
                        <div className="folder-grid-card-top">
                            <button
                                type="button"
                                className="folder-icon-btn"
                                onClick={() => void viewDocument(doc)}
                            >
                                <FolderFileIcon />
                            </button>
                            <div className="documents-col-action">
                                <button
                                    type="button"
                                    className="document-menu-button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onMenu(doc.id);
                                    }}
                                    aria-label={`Actions for ${doc.name}`}
                                >
                                    <MoreHorizontal size={18} />
                                </button>
                                {menuId === doc.id && (
                                    <div
                                        className="document-menu"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button type="button" onClick={() => void viewDocument(doc)}>
                                            <Eye size={15} /> <span>View</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="danger"
                                            onClick={() => onDelete(doc)}
                                        >
                                            <Trash2 size={15} /> <span>Delete</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="folder-grid-info" onClick={() => void viewDocument(doc)}>
                            <strong className="folder-grid-name">{doc.name}</strong>
                            <span className="folder-grid-meta">{doc.projectName || "General"}</span>
                            <div className="folder-grid-footer">
                                <span>{formatSize(doc.sizeBytes)}</span>
                                <time>{formatDate(doc.updatedAt)}</time>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        );
    }

    return (
        <div className="documents-table-wrapper">
            <div className="documents-table-card">
                <div className="documents-table-header">
                    <span className="th-name">NAME</span>
                    <span className="th-items">PROJECT</span>
                    <span className="th-size">SIZE</span>
                    <span className="th-date">LAST MODIFIED</span>
                    <span className="th-action"></span>
                </div>
                <div className="documents-table-body">
                    {documents.map((doc) => (
                        <div
                            className="documents-table-row"
                            key={doc.id}
                            onDoubleClick={() => void viewDocument(doc)}
                        >
                            <div
                                className="documents-col-name"
                                onClick={() => void viewDocument(doc)}
                            >
                                <FolderFileIcon />
                                <span className="documents-item-name">{doc.name}</span>
                            </div>
                            <div className="documents-col-items">
                                {doc.projectName || "General"}
                            </div>
                            <div className="documents-col-size">
                                {formatSize(doc.sizeBytes)}
                            </div>
                            <div className="documents-col-date">
                                {formatDate(doc.updatedAt)}
                            </div>
                            <div className="documents-col-action">
                                <button
                                    type="button"
                                    className="document-menu-button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onMenu(doc.id);
                                    }}
                                    aria-label={`Actions for ${doc.name}`}
                                >
                                    <MoreHorizontal size={18} />
                                </button>
                                {menuId === doc.id && (
                                    <div
                                        className="document-menu"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button type="button" onClick={() => void viewDocument(doc)}>
                                            <Eye size={15} /> <span>View</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="danger"
                                            onClick={() => onDelete(doc)}
                                        >
                                            <Trash2 size={15} /> <span>Delete</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
function FolderModal({
    onClose,
    onCreated,
    parentId,
}: {
    onClose: () => void;
    onCreated: () => void;
    parentId: string | null;
}) {
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    async function submit(event: React.FormEvent) {
        event.preventDefault();
        try {
            await apiJson("/api/v1/document-folders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, parentId }),
            });
            onCreated();
        } catch (submitError) {
            setError(getApiErrorMessage(submitError));
        }
    }
    return (
        <div className="document-modal-backdrop">
            <form className="document-modal small" onSubmit={submit}>
                <button
                    type="button"
                    className="document-modal-close"
                    onClick={onClose}
                >
                    <X />
                </button>
                <h2>New Folder</h2>
                {error && <p className="documents-error">{error}</p>}
                <label>
                    Folder Name{" "}
                    <input
                        required
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="ex. Projects"
                    />
                </label>
                <footer>
                    <button type="button" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="documents-primary">Create Folder</button>
                </footer>
            </form>
        </div>
    );
}
function UploadModal({
    folders,
    selectedFolder,
    onClose,
    onUploaded,
}: {
    folders: FolderItem[];
    selectedFolder: FolderItem | null;
    onClose: () => void;
    onUploaded: () => void;
}) {
    const [folderId, setFolderId] = useState(
        selectedFolder?.id || folders[0]?.id || "",
    );
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState("");
    async function submit(event: React.FormEvent) {
        event.preventDefault();
        if (!file || !folderId) return setError("Choose a folder and file.");
        const form = new FormData();
        form.append("folderId", folderId);
        form.append("file", file);
        try {
            await apiJson("/api/v1/documents/upload", { method: "POST", body: form });
            onUploaded();
        } catch (submitError) {
            setError(getApiErrorMessage(submitError));
        }
    }
    return (
        <div className="document-modal-backdrop">
            <form className="document-modal" onSubmit={submit}>
                <button
                    type="button"
                    className="document-modal-close"
                    onClick={onClose}
                >
                    <X />
                </button>
                <h2>Upload Files</h2>
                {error && <p className="documents-error">{error}</p>}
                <label>
                    Upload to{" "}
                    <select
                        value={folderId}
                        onChange={(event) => setFolderId(event.target.value)}
                    >
                        {folders.map((folder) => (
                            <option key={folder.id} value={folder.id}>
                                {folder.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="upload-drop">
                    <Upload size={22} />
                    <strong>{file ? file.name : "Drop files here"}</strong>
                    <small>or click to browse your computer</small>
                    <input
                        type="file"
                        onChange={(event) => setFile(event.target.files?.[0] || null)}
                    />
                </label>
                <footer>
                    <button type="button" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="documents-primary">Save &amp; Upload</button>
                </footer>
            </form>
        </div>
    );
}
function DeleteModal({
    title,
    description,
    label,
    info,
    onClose,
    onDelete,
}: {
    title: string;
    description: string;
    label: string;
    info?: string;
    onClose: () => void;
    onDelete: () => Promise<void>;
}) {
    const [checked, setChecked] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    async function confirm() {
        setBusy(true);
        setError("");
        try {
            await onDelete();
        } catch (deleteError) {
            setError(getApiErrorMessage(deleteError));
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="document-modal-backdrop" onClick={onClose}>
            <div className="document-modal delete-modal" onClick={(e) => e.stopPropagation()}>
                <div className="delete-icon">
                    <Trash2 size={24} />
                </div>
                <h2>{title}</h2>
                <p>{description}</p>
                {error && <p className="documents-error" role="alert">{error}</p>}
                <div className="delete-target">
                    <FolderFileIcon />
                    <div className="delete-target-info">
                        <strong>{label}</strong>
                        {info && <small>{info}</small>}
                    </div>
                </div>
                <label className="delete-check">
                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => setChecked(event.target.checked)}
                    />
                    <span>I understand this action cannot be undone</span>
                </label>
                <div className="delete-modal-actions">
                    <button type="button" className="delete-cancel-btn" onClick={onClose}>
                        No, Keep It.
                    </button>
                    <button
                        type="button"
                        className="delete-confirm-btn"
                        disabled={!checked || busy}
                        onClick={() => void confirm()}
                    >
                        {busy ? "Deleting..." : "Yes, Delete!"}
                    </button>
                </div>
            </div>
        </div>
    );
}
