"use client";

import React from "react";
import {
    FolderOpen,
    FolderPlus,
    MoreHorizontal,
    Pencil,
    Plus,
    Trash2,
} from "lucide-react";
import { FolderItem, formatDate, formatSize } from "./types";
import { FolderFileIcon } from "./FolderFileIcon";

interface FolderListProps {
    folders: FolderItem[];
    view: "list" | "grid";
    onOpen: (folder: FolderItem) => void;
    onMenu: (id: string) => void;
    menuId: string | null;
    onRename: (folder: FolderItem) => void;
    onDelete: (folder: FolderItem) => void;
    onCreateFolder: () => void;
    searchQuery?: string;
}

export default function FolderList({
    folders,
    view,
    onOpen,
    onMenu,
    menuId,
    onRename,
    onDelete,
    onCreateFolder,
    searchQuery = "",
}: FolderListProps) {
    if (folders.length === 0) {
        return (
            <div className="doc-empty-state">
                <div className="doc-empty-icon">
                    <FolderPlus size={28} />
                </div>
                <h3>{searchQuery ? "No matching folders" : "No folders found"}</h3>
                <p>
                    {searchQuery
                        ? `No folders match “${searchQuery}”. Try searching with a different keyword.`
                        : "Get started by organizing your documents into structured folders."}
                </p>
                <button
                    type="button"
                    className="btn-doc-new-folder"
                    onClick={onCreateFolder}
                >
                    <Plus size={18} />
                    <span>New Folder</span>
                </button>
            </div>
        );
    }

    if (view === "grid") {
        return (
            <div className="doc-grid-container folder-grid-view" role="grid" aria-label="Folders grid">
                {folders.map((folder) => {
                    const isMenuOpen = menuId === folder.id;
                    return (
                        <article
                            key={folder.id}
                            className="doc-grid-card folder-grid-card"
                            onClick={() => onOpen(folder)}
                            tabIndex={0}
                            role="gridcell"
                            aria-label={`Folder ${folder.name}`}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") onOpen(folder);
                            }}
                        >
                            <div className="doc-grid-card-top">
                                <div
                                    style={{ cursor: "pointer" }}
                                    title="Open Folder"
                                >
                                    <FolderFileIcon type="folder" />
                                </div>
                                <div style={{ position: "relative" }}>
                                    <button
                                        type="button"
                                        className="doc-action-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onMenu(folder.id);
                                        }}
                                        aria-label={`Actions for ${folder.name}`}
                                        aria-haspopup="true"
                                        aria-expanded={isMenuOpen}
                                    >
                                        <MoreHorizontal size={20} />
                                    </button>

                                    {isMenuOpen && (
                                        <div
                                            className="doc-menu-popover"
                                            onClick={(e) => e.stopPropagation()}
                                            role="menu"
                                        >
                                            <button
                                                type="button"
                                                className="doc-menu-item"
                                                onClick={() => onOpen(folder)}
                                                role="menuitem"
                                            >
                                                <FolderOpen size={18} />
                                                <span>Open Folder</span>
                                            </button>
                                            <button
                                                type="button"
                                                className="doc-menu-item"
                                                onClick={() => onRename(folder)}
                                                role="menuitem"
                                            >
                                                <Pencil size={18} />
                                                <span>Rename</span>
                                            </button>
                                            <button
                                                type="button"
                                                className="doc-menu-item danger"
                                                onClick={() => onDelete(folder)}
                                                role="menuitem"
                                            >
                                                <Trash2 size={18} />
                                                <span>Delete Folder</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="doc-grid-info">
                                <div className="doc-grid-row-1">
                                    <strong className="doc-grid-name" title={folder.name}>
                                        {folder.name}
                                    </strong>
                                    <time className="doc-grid-date">{formatDate(folder.updatedAt)}</time>
                                </div>
                                <div className="doc-grid-row-2">
                                    <span className="doc-grid-meta">
                                        {folder.itemCount === 1 ? "1 item" : `${folder.itemCount} items`}
                                    </span>
                                    <span className="doc-grid-size">{formatSize(folder.sizeBytes)}</span>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="doc-table-scroll">
            <div className="doc-table" role="table" aria-label="Folders table">
                {/* Frame 57: Header Row */}
                <div className="doc-table-header" role="row">
                    <span className="doc-th-name th-name" role="columnheader">NAME</span>
                    <span className="doc-th-items th-items" role="columnheader">ITEMS</span>
                    <span className="doc-th-size th-size" role="columnheader">SIZE</span>
                    <span className="doc-th-date th-date" role="columnheader">LAST MODIFIED</span>
                    <span className="doc-th-action" role="columnheader"></span>
                </div>

                {/* Frame 61: Rows */}
                <div className="doc-table-body" role="rowgroup">
                    {folders.map((folder, index) => {
                        const isMenuOpen = menuId === folder.id;
                        return (
                            <React.Fragment key={folder.id}>
                                <div
                                    className={`doc-table-row ${isMenuOpen ? "menu-open" : ""}`}
                                    onDoubleClick={() => onOpen(folder)}
                                    role="row"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") onOpen(folder);
                                    }}
                                >
                                    {/* Name cell with circle folder icon */}
                                    <div
                                        className="doc-td-name"
                                        onClick={() => onOpen(folder)}
                                        role="cell"
                                    >
                                        <FolderFileIcon type="folder" />
                                        <span className="doc-name-text" title={folder.name}>
                                            {folder.name}
                                        </span>
                                    </div>

                                    {/* Items cell */}
                                    <div
                                        className="doc-td-items"
                                        onClick={() => onOpen(folder)}
                                        role="cell"
                                    >
                                        {folder.itemCount === 1 ? "1 item" : `${folder.itemCount} items`}
                                    </div>

                                    {/* Size cell */}
                                    <div
                                        className="doc-td-size"
                                        onClick={() => onOpen(folder)}
                                        role="cell"
                                    >
                                        {formatSize(folder.sizeBytes)}
                                    </div>

                                    {/* Date cell */}
                                    <div
                                        className="doc-td-date"
                                        onClick={() => onOpen(folder)}
                                        role="cell"
                                    >
                                        {formatDate(folder.updatedAt)}
                                    </div>

                                    {/* Action cell with 3-dot trigger and popover */}
                                    <div className="doc-td-action" role="cell">
                                        <button
                                            type="button"
                                            className="doc-action-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onMenu(folder.id);
                                            }}
                                            aria-label={`Actions for ${folder.name}`}
                                            aria-haspopup="true"
                                            aria-expanded={isMenuOpen}
                                        >
                                            <MoreHorizontal size={20} />
                                        </button>

                                        {isMenuOpen && (
                                            <div
                                                className="doc-menu-popover"
                                                onClick={(e) => e.stopPropagation()}
                                                role="menu"
                                            >
                                                <button
                                                    type="button"
                                                    className="doc-menu-item"
                                                    onClick={() => onOpen(folder)}
                                                    role="menuitem"
                                                >
                                                    <FolderOpen size={18} />
                                                    <span>Open Folder</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="doc-menu-item"
                                                    onClick={() => onRename(folder)}
                                                    role="menuitem"
                                                >
                                                    <Pencil size={18} />
                                                    <span>Rename</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="doc-menu-item danger"
                                                    onClick={() => onDelete(folder)}
                                                    role="menuitem"
                                                >
                                                    <Trash2 size={18} />
                                                    <span>Delete Folder</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Row Divider (Rectangle 30, 39, etc.) */}
                                {index < folders.length - 1 && (
                                    <hr className="doc-row-divider" aria-hidden="true" />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
