import { MoodBoard, CreateMoodBoardInput, UpdateMoodBoardInput } from "./types";
import { INITIAL_MOOD_BOARDS, MOCK_PROJECTS, MOCK_CLIENTS, createSampleImageSvg } from "./mock-data";
import { generateId } from "./helpers";

export const STORAGE_KEY = "boq-saas:mood-boards:v1";

let inMemoryStore: MoodBoard[] | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadMoodBoards(): MoodBoard[] {
  if (!isBrowser()) {
    if (!inMemoryStore) {
      inMemoryStore = [...INITIAL_MOOD_BOARDS];
    }
    return inMemoryStore;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // First time initialization
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOOD_BOARDS));
      return INITIAL_MOOD_BOARDS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    // If empty array or invalid, seed with initial mock data
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOOD_BOARDS));
    return INITIAL_MOOD_BOARDS;
  } catch (err) {
    console.error("Failed to load mood boards from localStorage, using initial mock data:", err);
    return INITIAL_MOOD_BOARDS;
  }
}

export function saveMoodBoards(boards: MoodBoard[]): void {
  if (!isBrowser()) {
    inMemoryStore = [...boards];
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(boards));
    // Trigger custom event so any other mounted listeners can synchronize
    window.dispatchEvent(new CustomEvent("boq-moodboards-updated", { detail: boards }));
  } catch (err) {
    console.error("Failed to save mood boards to localStorage:", err);
  }
}

export function getMoodBoardById(id: string): MoodBoard | null {
  const all = loadMoodBoards();
  return all.find((b) => b.id === id) || null;
}

export function addMoodBoard(input: CreateMoodBoardInput): MoodBoard {
  const all = loadMoodBoards();
  const matchedProject = MOCK_PROJECTS.find((p) => p.id === input.projectId);
  const projectName = input.projectName || matchedProject?.name || "Untitled Project";

  const matchedClient = MOCK_CLIENTS.find((c) => c.id === input.clientId);
  const clientName =
    input.clientName ||
    matchedClient?.name ||
    matchedProject?.defaultClientName ||
    "General Client";
  const clientSubtitle =
    input.clientSubtitle ||
    matchedClient?.subtitle ||
    matchedProject?.defaultClientSubtitle ||
    "Commercial";

  const newBoard: MoodBoard = {
    id: generateId("mb"),
    name: input.name.trim(),
    description: input.description?.trim(),
    projectId: input.projectId,
    projectName,
    clientId: input.clientId || "client-1",
    clientName,
    clientSubtitle,
    boqReference: input.boqReference || matchedProject?.boqReference || "BOQ-0029",
    leadId: input.leadId,
    leadName: input.leadName,
    mode: input.mode || "blank",
    categories: input.categories || [],
    images: input.images || [],
    status: input.status || "DRAFT",
    createdBy: input.createdBy || "Jenny Wilson",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    coverImage: input.coverImage || (input.images && input.images.length > 0 ? input.images[0].previewUrl : createSampleImageSvg(input.name, ["#1e293b", "#334155", "#475569"], projectName)),
  };

  const updated = [newBoard, ...all];
  saveMoodBoards(updated);
  return newBoard;
}

export function updateMoodBoard(id: string, input: UpdateMoodBoardInput): MoodBoard | null {
  const all = loadMoodBoards();
  const index = all.findIndex((b) => b.id === id);
  if (index === -1) return null;

  const current = all[index];
  const matchedProject = input.projectId
    ? MOCK_PROJECTS.find((p) => p.id === input.projectId)
    : null;
  const matchedClient = input.clientId
    ? MOCK_CLIENTS.find((c) => c.id === input.clientId)
    : null;

  const updatedBoard: MoodBoard = {
    ...current,
    ...input,
    projectName: input.projectName || (matchedProject ? matchedProject.name : current.projectName),
    clientName: input.clientName || (matchedClient ? matchedClient.name : current.clientName),
    clientSubtitle:
      input.clientSubtitle !== undefined
        ? input.clientSubtitle
        : (matchedClient?.subtitle || current.clientSubtitle),
    boqReference:
      input.boqReference !== undefined
        ? input.boqReference
        : (matchedProject?.boqReference || current.boqReference || "BOQ-0029"),
    updatedAt: new Date().toISOString(),
  };

  all[index] = updatedBoard;
  saveMoodBoards(all);
  return updatedBoard;
}

export function deleteMoodBoard(id: string): boolean {
  const all = loadMoodBoards();
  const filtered = all.filter((b) => b.id !== id);
  if (filtered.length === all.length) return false;
  saveMoodBoards(filtered);
  return true;
}

export function duplicateMoodBoard(id: string): MoodBoard | null {
  const all = loadMoodBoards();
  const target = all.find((b) => b.id === id);
  if (!target) return null;

  const duplicated: MoodBoard = {
    ...target,
    id: generateId("mb"),
    name: `${target.name} (Copy)`,
    images: target.images.map((img, i) => ({
      ...img,
      id: generateId(`img-${i}`),
    })),
    status: "DRAFT",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updated = [duplicated, ...all];
  saveMoodBoards(updated);
  return duplicated;
}

export function archiveMoodBoard(id: string): MoodBoard | null {
  return updateMoodBoard(id, { status: "ARCHIVED" });
}

export function resetToMockData(): MoodBoard[] {
  if (isBrowser()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOOD_BOARDS));
  }
  return INITIAL_MOOD_BOARDS;
}

export const DRAFT_STORAGE_KEY = "boq-saas:mood-boards:draft:v1";

let inMemoryDraft: any = null;

export function saveDraftMoodBoard(data: any): void {
  if (!isBrowser()) {
    inMemoryDraft = data;
    return;
  }
  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Failed to save mood board draft:", err);
  }
}

export function loadDraftMoodBoard(): any | null {
  if (!isBrowser()) {
    return inMemoryDraft;
  }
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearDraftMoodBoard(): void {
  if (!isBrowser()) {
    inMemoryDraft = null;
    return;
  }
  try {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // ignore
  }
}
