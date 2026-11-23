export type MoodBoardStatus =
  | "DRAFT"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "ARCHIVED";

export interface MoodBoardImage {
  id: string;
  name: string;
  previewUrl: string;
  fileType?: string;
  size?: number;
  isCover?: boolean;
  uploadedAt?: string;
  notes?: string;
}

export interface MoodBoardItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface MoodBoardItemGroup {
  id: string;
  name: string;
  itemCount?: number;
  items: MoodBoardItem[];
}

export interface MoodBoardCategory {
  id: string;
  name: string;
  expanded?: boolean;
  imageCount?: number;
  images?: MoodBoardImage[];
  itemGroups?: MoodBoardItemGroup[];
}

export interface MoodBoardLeadOption {
  id: string;
  name: string;
  role?: string;
  avatar?: string;
}

export interface MoodBoard {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string;
  clientSubtitle?: string;
  boqReference?: string;
  leadId?: string;
  leadName?: string;
  mode?: "blank" | "template";
  categories?: MoodBoardCategory[];
  images: MoodBoardImage[];
  status: MoodBoardStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  coverImage?: string;
}

export interface CreateMoodBoardInput {
  name: string;
  projectId: string;
  projectName?: string;
  clientId?: string;
  clientName?: string;
  clientSubtitle?: string;
  boqReference?: string;
  leadId?: string;
  leadName?: string;
  mode?: "blank" | "template";
  categories?: MoodBoardCategory[];
  description?: string;
  status?: MoodBoardStatus;
  coverImage?: string;
  images?: MoodBoardImage[];
  createdBy?: string;
}

export interface UpdateMoodBoardInput {
  name?: string;
  projectId?: string;
  projectName?: string;
  clientId?: string;
  clientName?: string;
  clientSubtitle?: string;
  boqReference?: string;
  leadId?: string;
  leadName?: string;
  mode?: "blank" | "template";
  categories?: MoodBoardCategory[];
  description?: string;
  status?: MoodBoardStatus;
  coverImage?: string;
  images?: MoodBoardImage[];
}

export interface MoodBoardFilterState {
  status: string; // "ALL" or MoodBoardStatus
  projectId: string; // "ALL" or projectId
  clientId: string; // "ALL" or clientId
  createdBy: string; // "ALL" or creator name
  search: string;
}

export interface MoodBoardProjectOption {
  id: string;
  name: string;
  defaultClientId: string;
  defaultClientName: string;
  defaultClientSubtitle?: string;
  boqReference?: string;
}

export interface MoodBoardClientOption {
  id: string;
  name: string;
  subtitle?: string;
}

export interface MoodBoardTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  coverImage: string;
  images: MoodBoardImage[];
  tags: string[];
}

export interface MoodBoardRepository {
  getAll(): Promise<MoodBoard[]>;
  getById(id: string): Promise<MoodBoard | null>;
  create(input: CreateMoodBoardInput): Promise<MoodBoard>;
  update(id: string, input: UpdateMoodBoardInput): Promise<MoodBoard>;
  delete(id: string): Promise<void>;
  duplicate(id: string): Promise<MoodBoard>;
  archive(id: string): Promise<MoodBoard>;
  getTemplates?(): Promise<MoodBoardTemplate[]>;
  saveDraft?(data: any): void;
  loadDraft?(): any | null;
  clearDraft?(): void;
}
