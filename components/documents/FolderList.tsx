"use client";

import { Eye, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { FolderItem, formatDate, formatSize } from "./types";
import { FolderFileIcon } from "./FolderFileIcon";

interface FolderListProps {
    folders: FolderItem[];
    view: "list" | "grid";
    onOpen: (folder: FolderItem) => void;
    onMenu: (id: string) => void;
    menuId: string | null;
    onDelete: (folder: FolderItem) => void;
    onCreateFolder: () => void;
}

export default function FolderList({
    folders,
    view,
    onOpen,
    onMenu,
    menuId,
    onDelete,
    onCreateFolder,
}: FolderListProps) {
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
