import {
  MoodBoard,
  CreateMoodBoardInput,
  UpdateMoodBoardInput,
  MoodBoardRepository,
  MoodBoardTemplate,
} from "./types";
import { MOCK_MOOD_BOARD_TEMPLATES } from "./mock-data";
import {
  loadMoodBoards,
  getMoodBoardById,
  addMoodBoard,
  updateMoodBoard,
  deleteMoodBoard,
  duplicateMoodBoard,
  archiveMoodBoard,
  saveDraftMoodBoard,
  loadDraftMoodBoard,
  clearDraftMoodBoard,
} from "./storage";

const USE_MOOD_BOARD_API = process.env.NEXT_PUBLIC_MOOD_BOARDS_BACKEND === "api";

async function moodApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/v1/mood-boards${path}`, { credentials: "include", ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || "Mood board request failed.");
  return payload.data as T;
}

export class LocalMoodBoardRepository implements MoodBoardRepository {
  async getAll(): Promise<MoodBoard[]> {
    if (USE_MOOD_BOARD_API) { const result = await moodApi<{ items: MoodBoard[]; total: number }>(""); return result.items || []; }
    return loadMoodBoards();
  }

  async getById(id: string): Promise<MoodBoard | null> {
    if (USE_MOOD_BOARD_API) { try { return await moodApi<MoodBoard>(`/${id}`); } catch { return null; } }
    return getMoodBoardById(id);
  }

  async create(input: CreateMoodBoardInput): Promise<MoodBoard> {
    if (USE_MOOD_BOARD_API) return moodApi<MoodBoard>("", { method: "POST", body: JSON.stringify(input) });
    return addMoodBoard(input);
  }

  async update(id: string, input: UpdateMoodBoardInput): Promise<MoodBoard> {
    if (USE_MOOD_BOARD_API) return moodApi<MoodBoard>(`/${id}`, { method: "PATCH", body: JSON.stringify(input) });
    const updated = updateMoodBoard(id, input);
    if (!updated) {
      throw new Error(`Mood board with id ${id} not found.`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    if (USE_MOOD_BOARD_API) { await moodApi(`/` + id, { method: "DELETE" }); return; }
    const success = deleteMoodBoard(id);
    if (!success) {
      throw new Error(`Mood board with id ${id} not found.`);
    }
  }

  async duplicate(id: string): Promise<MoodBoard> {
    if (USE_MOOD_BOARD_API) return moodApi<MoodBoard>(`/${id}/duplicate`, { method: "POST" });
    const duplicated = duplicateMoodBoard(id);
    if (!duplicated) {
      throw new Error(`Mood board with id ${id} not found.`);
    }
    return duplicated;
  }

  async archive(id: string): Promise<MoodBoard> {
    if (USE_MOOD_BOARD_API) return this.update(id, { status: "ARCHIVED" });
    const archived = archiveMoodBoard(id);
    if (!archived) {
      throw new Error(`Mood board with id ${id} not found.`);
    }
    return archived;
  }

  async getTemplates(): Promise<MoodBoardTemplate[]> {
    return MOCK_MOOD_BOARD_TEMPLATES;
  }

  saveDraft(data: any): void {
    saveDraftMoodBoard(data);
  }

  loadDraft(): any | null {
    return loadDraftMoodBoard();
  }

  clearDraft(): void {
    clearDraftMoodBoard();
  }
}

export const moodBoardRepository = new LocalMoodBoardRepository();
