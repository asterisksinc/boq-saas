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

export class LocalMoodBoardRepository implements MoodBoardRepository {
  async getAll(): Promise<MoodBoard[]> {
    return loadMoodBoards();
  }

  async getById(id: string): Promise<MoodBoard | null> {
    return getMoodBoardById(id);
  }

  async create(input: CreateMoodBoardInput): Promise<MoodBoard> {
    return addMoodBoard(input);
  }

  async update(id: string, input: UpdateMoodBoardInput): Promise<MoodBoard> {
    const updated = updateMoodBoard(id, input);
    if (!updated) {
      throw new Error(`Mood board with id ${id} not found.`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const success = deleteMoodBoard(id);
    if (!success) {
      throw new Error(`Mood board with id ${id} not found.`);
    }
  }

  async duplicate(id: string): Promise<MoodBoard> {
    const duplicated = duplicateMoodBoard(id);
    if (!duplicated) {
      throw new Error(`Mood board with id ${id} not found.`);
    }
    return duplicated;
  }

  async archive(id: string): Promise<MoodBoard> {
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
