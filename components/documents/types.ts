export type FolderItem = {
    id: string;
    parentId: string | null;
    name: string;
    itemCount: number;
    sizeBytes: number;
    updatedAt: string;
};

export type DocumentItem = {
    id: string;
    folderId: string;
    projectName: string | null;
    name: string;
    mimeType: string;
    sizeBytes: number;
    updatedAt: string;
};

export function formatSize(bytes: number): string {
    if (!bytes || bytes <= 0) return "0 KB";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function formatDate(value: string): string {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "—";
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleDateString("en-US", { month: "short" });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
}
