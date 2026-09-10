"use client";

import {
    Eye,
    File,
    Folder,
    Grid2X2,
    List,
    MoreVertical,
    Plus,
    Search,
    Trash2,
    Upload,
    X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import DashboardRail from "@/components/DashboardRail";

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
    if (!bytes) return "0 KB";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        units.length - 1,
    );
    return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}
function formatDate(value: string) {
    return new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
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
    const [targetDocument, setTargetDocument] = useState<DocumentItem | null>(
        null,
    );
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
            } else setDocuments([]);
        } catch (loadError) {
            setError(getApiErrorMessage(loadError));
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        void loadFolders();
    }, [activeFolder, search]);
    const goRoot = () => {
        setActiveFolder(null);
        setMenuId(null);
    };
    return (
        <main className="fig-dashboard documents-page">
            <div className="fig-dashboard-glow" />
            <DashboardRail />
            <div className="fig-dashboard-main">
                <header className="fig-dashboard-header">
                    <h1>Documents</h1>
                    <div className="fig-dashboard-header-actions">
                        <label className="fig-dashboard-search">
                            <Search size={17} />
                            <input placeholder="Search..." aria-label="Search documents" />
                        </label>
                        <button className="fig-dashboard-new" type="button" onClick={() => setModal("folder")}>
                            <Plus size={20} />
                            <span>New</span>
                            <i />
                            <span>⌄</span>
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
                    <div className="documents-toolbar">
                        <label className="documents-search">
                            <Search size={18} />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search files..."
                                aria-label="Search files"
                            />
                        </label>
                        <div className="documents-view-toggle">
                            <button
                                className={view === "list" ? "active" : ""}
                                onClick={() => setView("list")}
                                aria-label="List view"
                            >
                                <List size={19} />
                            </button>
                            <button
                                className={view === "grid" ? "active" : ""}
                                onClick={() => setView("grid")}
                                aria-label="Card view"
                            >
                                <Grid2X2 size={18} />
                            </button>
                        </div>
                    </div>
                    {activeFolder ? (
                        <div className="documents-breadcrumb">
                            <button onClick={goRoot}>All Folders</button>
                            <span>›</span>
                            <strong>{activeFolder.name}</strong>
                        </div>
                    ) : (
                        <h2>All Folders</h2>
                    )}
                    <div className="documents-actions">
                        <button
                            className="documents-ghost"
                            onClick={() => setModal("upload")}
                        >
                            <Upload size={16} /> Upload
                        </button>
                        <button
                            className="documents-primary"
                            onClick={() => setModal("folder")}
                        >
                            <Plus size={16} /> New Folder
                        </button>
                    </div>
                    {activeFolder && (
                        <div className="folder-banner">
                            <span>
                                <Folder size={22} />
                            </span>
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
                            {error}
                            <button onClick={() => void loadFolders()}>Try again</button>
                        </div>
                    )}
                    {loading ? (
                        <div className="documents-loading" />
                    ) : activeFolder ? (
                        <DocumentList
                            documents={documents}
                            view={view}
                            onMenu={(id) => setMenuId(menuId === id ? null : id)}
                            menuId={menuId}
                            onDelete={(document) => {
                                setTargetDocument(document);
                                setModal("delete-document");
                                setMenuId(null);
                            }}
                        />
                    ) : (
                        <FolderList
                            folders={folders}
                            view={view}
                            onOpen={setActiveFolder}
                            onMenu={(id) => setMenuId(menuId === id ? null : id)}
                            menuId={menuId}
                            onDelete={(folder) => {
                                setTargetFolder(folder);
                                setModal("delete-folder");
                                setMenuId(null);
                            }}
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
function FolderList({
    folders,
    view,
    onOpen,
    onMenu,
    menuId,
    onDelete,
}: {
    folders: FolderItem[];
    view: "list" | "grid";
    onOpen: (folder: FolderItem) => void;
    onMenu: (id: string) => void;
    menuId: string | null;
    onDelete: (folder: FolderItem) => void;
}) {
    return (
        <div className={`folder-list ${view}`}>
            {folders.map((folder) => (
                <article
                    className="folder-card"
                    key={folder.id}
                    onDoubleClick={() => onOpen(folder)}
                >
                    <button className="folder-open" onClick={() => onOpen(folder)}>
                        <Folder size={21} />
                    </button>
                    <div className="folder-name">
                        <strong>{folder.name}</strong>
                        <small>{folder.itemCount} items</small>
                    </div>
                    <span className="folder-size">{formatSize(folder.sizeBytes)}</span>
                    <time>{formatDate(folder.updatedAt)}</time>
                    <button
                        className="document-menu-button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onMenu(folder.id);
                        }}
                        aria-label={`Actions for ${folder.name}`}
                    >
                        <MoreVertical size={18} />
                    </button>
                    {menuId === folder.id && (
                        <div className="document-menu">
                            <button onClick={() => onOpen(folder)}>
                                <Eye size={17} /> Open Folder
                            </button>
                            <button className="danger" onClick={() => onDelete(folder)}>
                                <Trash2 size={17} /> Delete Folder
                            </button>
                        </div>
                    )}
                </article>
            ))}
        </div>
    );
}
function DocumentList({
    documents,
    view,
    onMenu,
    menuId,
    onDelete,
}: {
    documents: DocumentItem[];
    view: "list" | "grid";
    onMenu: (id: string) => void;
    menuId: string | null;
    onDelete: (document: DocumentItem) => void;
}) {
    async function viewDocument(document: DocumentItem) {
        const result = await apiJson<{ url: string }>(
            `/api/v1/documents/${document.id}/download`,
        );
        window.open(result.url, "_blank", "noopener,noreferrer");
    }
    return (
        <div className={`document-list ${view}`}>
            {documents.map((document) => (
                <article className="document-card" key={document.id}>
                    <span className="document-file-icon">
                        <File size={18} />
                    </span>
                    <div>
                        <strong>{document.name}</strong>
                        <small>{document.projectName || "General"}</small>
                    </div>
                    <span>{formatSize(document.sizeBytes)}</span>
                    <time>{formatDate(document.updatedAt)}</time>
                    <button
                        className="document-menu-button"
                        onClick={() => onMenu(document.id)}
                        aria-label={`Actions for ${document.name}`}
                    >
                        <MoreVertical size={18} />
                    </button>
                    {menuId === document.id && (
                        <div className="document-menu">
                            <button onClick={() => void viewDocument(document)}>
                                <Eye size={17} /> View
                            </button>
                            <button className="danger" onClick={() => onDelete(document)}>
                                <Trash2 size={17} /> Delete
                            </button>
                        </div>
                    )}
                </article>
            ))}
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
    onClose,
    onDelete,
}: {
    title: string;
    description: string;
    label: string;
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
        <div className="document-modal-backdrop">
            <div className="document-modal delete-modal">
                <div className="delete-icon">
                    <Trash2 size={27} />
                </div>
                <h2>{title}</h2>
                <p>{description}</p>
                {error && <p className="documents-error" role="alert">{error}</p>}
                <div className="delete-target">
                    <File size={18} />
                    <strong>{label}</strong>
                </div>
                <label className="delete-check">
                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => setChecked(event.target.checked)}
                    />{" "}
                    I understand this action cannot be undone
                </label>
                <footer>
                    <button onClick={onClose}>No, Keep It</button>
                    <button
                        className="delete-confirm"
                        disabled={!checked || busy}
                        onClick={() => void confirm()}
                    >
                        {busy ? "Deleting..." : "Yes, Delete!"}
                    </button>
                </footer>
            </div>
        </div>
    );
}
