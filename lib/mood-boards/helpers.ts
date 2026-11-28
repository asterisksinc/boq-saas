import { MoodBoard, MoodBoardFilterState } from "./types";

export function formatRelativeDate(dateString: string): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 60 && diffMinutes >= 0) {
    return "Today";
  }
  if (diffHours < 24 && now.getDate() === date.getDate()) {
    return "Today";
  }
  if (diffDays === 1 || (diffDays === 0 && now.getDate() !== date.getDate())) {
    return "1 day ago";
  }
  if (diffDays > 1 && diffDays < 7) {
    return `${diffDays} days ago`;
  }
  if (diffDays >= 7 && diffDays < 14) {
    return "1 week ago";
  }
  if (diffDays >= 14 && diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} weeks ago`;
  }
  if (diffDays >= 30 && diffDays < 60) {
    return "1 month ago";
  }
  if (diffDays >= 60) {
    const months = Math.floor(diffDays / 30);
    return `${months} months ago`;
  }
  return "Today";
}

export function formatDateDisplay(dateString: string): string {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function generateId(prefix = "mb"): string {
  const randomPart = Math.random().toString(36).substring(2, 9);
  const timePart = Date.now().toString(36);
  return `${prefix}-${timePart}-${randomPart}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function filterMoodBoards(
  boards: MoodBoard[],
  filters: MoodBoardFilterState
): MoodBoard[] {
  return boards.filter((board) => {
    // 1. Search (Mood Board name, Project name, Client name)
    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      const matchName = board.name.toLowerCase().includes(q);
      const matchProject = board.projectName.toLowerCase().includes(q);
      const matchClient =
        board.clientName.toLowerCase().includes(q) ||
        (board.clientSubtitle && board.clientSubtitle.toLowerCase().includes(q));
      if (!matchName && !matchProject && !matchClient) {
        return false;
      }
    }

    // 2. Status filter
    if (filters.status && filters.status !== "ALL") {
      if (board.status !== filters.status) {
        return false;
      }
    }

    // 3. Project filter
    if (filters.projectId && filters.projectId !== "ALL") {
      if (board.projectId !== filters.projectId && board.projectName !== filters.projectId) {
        return false;
      }
    }

    // 4. Client filter
    if (filters.clientId && filters.clientId !== "ALL") {
      if (board.clientId !== filters.clientId && board.clientName !== filters.clientId) {
        return false;
      }
    }

    // 5. Created By filter
    if (filters.createdBy && filters.createdBy !== "ALL") {
      if (board.createdBy.toLowerCase() !== filters.createdBy.toLowerCase()) {
        return false;
      }
    }

    return true;
  });
}

export function formatFilenameToTitle(filename: string): string {
  if (!filename) return "Untitled Image";
  // Remove file extension
  const withoutExt = filename.replace(/\.[^/.]+$/, "");
  // Replace hyphens, underscores, dots with spaces
  const cleaned = withoutExt.replace(/[-_.]+/g, " ").trim();
  // Capitalize words
  return (
    cleaned
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ") || "Untitled Image"
  );
}
