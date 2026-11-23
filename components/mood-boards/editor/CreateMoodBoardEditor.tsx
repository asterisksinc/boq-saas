"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle } from "lucide-react";
import {
  MoodBoardCategory,
  MoodBoardImage,
  MoodBoardItem,
  MoodBoardTemplate,
} from "@/lib/mood-boards/types";
import {
  MOCK_PROJECTS,
  MOCK_LEADS,
  createInitialCategories,
  MOCK_MOOD_BOARD_TEMPLATES,
} from "@/lib/mood-boards/mock-data";
import { moodBoardRepository } from "@/lib/mood-boards/repository";
import {
  saveDraftMoodBoard,
  loadDraftMoodBoard,
  clearDraftMoodBoard,
} from "@/lib/mood-boards/storage";
import { generateId } from "@/lib/mood-boards/helpers";
import MoodBoardActionBar from "./MoodBoardActionBar";
import MoodBoardBasicDetails from "./MoodBoardBasicDetails";
import MoodBoardCategories from "./MoodBoardCategories";
import MoodBoardItems from "./MoodBoardItems";
import MoodBoardPreview from "./MoodBoardPreview";
import UnsavedChangesDialog from "./UnsavedChangesDialog";
import MoodBoardTemplateSelection from "../MoodBoardTemplateSelection";

interface CreateMoodBoardEditorProps {
  initialTemplate?: MoodBoardTemplate | null;
  mode?: "blank" | "template";
}

export default function CreateMoodBoardEditor({
  initialTemplate = null,
  mode = "blank",
}: CreateMoodBoardEditorProps) {
  const router = useRouter();

  // Core Form State
  const [name, setName] = useState(
    initialTemplate ? `${initialTemplate.name} Concept` : ""
  );
  const [projectId, setProjectId] = useState(MOCK_PROJECTS[0]?.id || "");
  const [leadId, setLeadId] = useState(MOCK_LEADS[0]?.id || "");
  const [description, setDescription] = useState(
    initialTemplate?.description || ""
  );

  // Categories & Items State
  const [categories, setCategories] = useState<MoodBoardCategory[]>(() => {
    return createInitialCategories();
  });
  const [activeCategoryId, setActiveCategoryId] = useState<string>("cat-master-bedroom");
  const [activeGroupId, setActiveGroupId] = useState<string>("grp-furniture");

  // Cover image
  const [coverImage, setCoverImage] = useState<string>(
    initialTemplate?.coverImage || ""
  );

  // Validation errors
  const [errors, setErrors] = useState<{
    name?: string;
    project?: string;
    lead?: string;
  }>({});

  // UI state
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUnsavedOpen, setIsUnsavedOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToast({ message, type });
      setTimeout(() => {
        setToast((cur) => (cur?.message === message ? null : cur));
      }, 3500);
    },
    []
  );

  // Load draft if available on initial blank mode
  useEffect(() => {
    if (!initialTemplate) {
      const draft = loadDraftMoodBoard();
      if (draft && draft.name) {
        setName(draft.name || "");
        if (draft.projectId) setProjectId(draft.projectId);
        if (draft.leadId) setLeadId(draft.leadId);
        if (draft.description) setDescription(draft.description);
        if (draft.categories && draft.categories.length > 0) {
          setCategories(draft.categories);
        }
        if (draft.coverImage) setCoverImage(draft.coverImage);
      }
    }
  }, [initialTemplate]);

  // Derived current references
  const currentProject = useMemo(() => {
    return MOCK_PROJECTS.find((p) => p.id === projectId) || MOCK_PROJECTS[0];
  }, [projectId]);

  const currentLead = useMemo(() => {
    return MOCK_LEADS.find((l) => l.id === leadId) || MOCK_LEADS[0];
  }, [leadId]);

  const activeCategory = useMemo(() => {
    return (
      categories.find((c) => c.id === activeCategoryId) ||
      categories[0] || {
        id: "cat-default",
        name: "General",
        images: [],
        itemGroups: [],
      }
    );
  }, [categories, activeCategoryId]);

  // Mark dirty on changes
  const handleNameChange = (val: string) => {
    setName(val);
    setIsDirty(true);
    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
  };

  const handleProjectChange = (val: string) => {
    setProjectId(val);
    setIsDirty(true);
    if (errors.project) setErrors((prev) => ({ ...prev, project: undefined }));
  };

  const handleLeadChange = (val: string) => {
    setLeadId(val);
    setIsDirty(true);
    if (errors.lead) setErrors((prev) => ({ ...prev, lead: undefined }));
  };

  const handleDescriptionChange = (val: string) => {
    setDescription(val);
    setIsDirty(true);
  };

  // Category Actions
  const handleSelectCategory = (id: string) => {
    setActiveCategoryId(id);
    const cat = categories.find((c) => c.id === id);
    if (cat?.itemGroups && cat.itemGroups.length > 0) {
      setActiveGroupId(cat.itemGroups[0].id);
    }
  };

  const handleToggleExpand = (id: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, expanded: !c.expanded } : c))
    );
  };

  const handleAddCategory = (newCategoryName: string) => {
    const newCat: MoodBoardCategory = {
      id: `cat-${generateId()}`,
      name: newCategoryName,
      expanded: true,
      imageCount: 0,
      images: [],
      itemGroups: [
        {
          id: `grp-${generateId()}`,
          name: "General Items",
          itemCount: 0,
          items: [],
        },
      ],
    };
    setCategories((prev) => [...prev, newCat]);
    setActiveCategoryId(newCat.id);
    setActiveGroupId(newCat.itemGroups![0].id);
    setIsDirty(true);
    showToast(`Category "${newCategoryName}" added.`);
  };

  const handleDeleteCategory = (id: string) => {
    setCategories((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (activeCategoryId === id && filtered.length > 0) {
        setActiveCategoryId(filtered[0].id);
      }
      return filtered;
    });
    setIsDirty(true);
    showToast("Category removed.");
  };

  const handleRenameCategory = (id: string, newName: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: newName } : c))
    );
    setIsDirty(true);
    showToast(`Category renamed to "${newName}".`);
  };

  const handleReorderCategories = (newOrder: MoodBoardCategory[]) => {
    setCategories(newOrder);
    setIsDirty(true);
  };

  // Item Actions
  const handleAddItem = (groupId: string) => {
    const newItem: MoodBoardItem = {
      id: `item-${generateId()}`,
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0,
    };

    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== activeCategoryId) return cat;
        const updatedGroups = (cat.itemGroups || []).map((grp) => {
          if (grp.id !== groupId) return grp;
          const updatedItems = [...grp.items, newItem];
          return {
            ...grp,
            items: updatedItems,
            itemCount: updatedItems.length,
          };
        });
        return { ...cat, itemGroups: updatedGroups };
      })
    );
    setIsDirty(true);
  };

  const handleUpdateItem = (
    groupId: string,
    itemId: string,
    field: "description" | "quantity" | "rate",
    value: string | number
  ) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== activeCategoryId) return cat;
        const updatedGroups = (cat.itemGroups || []).map((grp) => {
          if (grp.id !== groupId) return grp;
          const updatedItems = grp.items.map((item) => {
            if (item.id !== itemId) return item;
            const updated = { ...item, [field]: value };
            const q =
              field === "quantity" ? Number(value) : item.quantity;
            const r = field === "rate" ? Number(value) : item.rate;
            updated.amount = q * r;
            return updated;
          });
          return { ...grp, items: updatedItems };
        });
        return { ...cat, itemGroups: updatedGroups };
      })
    );
    setIsDirty(true);
  };

  const handleDeleteItem = (groupId: string, itemId: string) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== activeCategoryId) return cat;
        const updatedGroups = (cat.itemGroups || []).map((grp) => {
          if (grp.id !== groupId) return grp;
          const updatedItems = grp.items.filter((i) => i.id !== itemId);
          return {
            ...grp,
            items: updatedItems,
            itemCount: updatedItems.length,
          };
        });
        return { ...cat, itemGroups: updatedGroups };
      })
    );
    setIsDirty(true);
  };

  // Image Actions
  const handleAddImagesToCategory = (
    categoryId: string,
    newImages: MoodBoardImage[]
  ) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== categoryId) return cat;
        const currentImages = cat.images || [];
        const combined = [...currentImages, ...newImages];
        return {
          ...cat,
          images: combined,
          imageCount: combined.length,
        };
      })
    );
    setIsDirty(true);
    showToast(
      `Added ${newImages.length} ${
        newImages.length === 1 ? "image" : "images"
      } to ${activeCategory.name}.`
    );
  };

  const handleRemoveImageFromCategory = (
    categoryId: string,
    imageId: string
  ) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== categoryId) return cat;
        const filtered = (cat.images || []).filter((i) => i.id !== imageId);
        return {
          ...cat,
          images: filtered,
          imageCount: filtered.length,
        };
      })
    );
    setIsDirty(true);
    showToast("Image removed.");
  };

  // Template Replacement
  const handleApplyTemplate = (tpl: MoodBoardTemplate) => {
    setName(`${tpl.name} Concept`);
    setDescription(tpl.description);
    setCoverImage(tpl.coverImage);
    if (tpl.images && tpl.images.length > 0) {
      handleAddImagesToCategory(activeCategoryId, tpl.images);
    }
    setIsTemplateModalOpen(false);
    setIsDirty(true);
    showToast(`Template "${tpl.name}" applied.`);
  };

  // Navigation & Safety Check
  const handleBackOrCancel = (destination: string = "/mood-boards") => {
    if (isDirty) {
      setPendingNavigation(destination);
      setIsUnsavedOpen(true);
    } else {
      router.push(destination);
    }
  };

  // Save as Draft
  const handleSaveDraft = () => {
    const draftData = {
      name: name.trim() || "Untitled Mood Board",
      projectId,
      leadId,
      description: description.trim(),
      categories,
      coverImage,
      savedAt: new Date().toISOString(),
    };

    saveDraftMoodBoard(draftData);
    setIsDirty(false);
    showToast("Draft saved successfully to local storage.");
  };

  // Create Mood Board
  const handleCreate = async () => {
    const newErrors: { name?: string; project?: string; lead?: string } = {};

    if (!name.trim()) {
      newErrors.name = "Mood board name is required";
    }
    if (!projectId) {
      newErrors.project = "Please select a project";
    }
    if (!leadId) {
      newErrors.lead = "Please select a lead";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast("Please fill in all required fields.", "error");
      return;
    }

    setIsSaving(true);
    try {
      // Gather all images from all categories
      const allCategoryImages = categories.reduce<MoodBoardImage[]>(
        (acc, c) => acc.concat(c.images || []),
        []
      );

      const created = await moodBoardRepository.create({
        name: name.trim(),
        projectId,
        projectName: currentProject?.name,
        clientId: currentProject?.defaultClientId || "client-1",
        clientName: currentProject?.defaultClientName || "Client",
        clientSubtitle: currentProject?.defaultClientSubtitle,
        boqReference: currentProject?.boqReference || "BOQ-0029",
        leadId,
        leadName: currentLead?.name,
        description: description.trim(),
        mode,
        categories,
        coverImage: coverImage || allCategoryImages[0]?.previewUrl,
        images: allCategoryImages,
        status: "DRAFT",
        createdBy: currentLead?.name || "Jenny Wilson",
      });

      clearDraftMoodBoard();
      setIsDirty(false);
      showToast(`Mood Board "${created.name}" created successfully!`);

      setTimeout(() => {
        router.push(`/mood-boards?created=${created.id}`);
      }, 400);
    } catch (err) {
      console.error(err);
      showToast("Failed to create mood board. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mb-create-editor-view">
      {/* Top Action Bar (Frame 2147225068) */}
      <MoodBoardActionBar
        title="Create Mood Board"
        onBack={() => handleBackOrCancel("/mood-boards")}
        onCancel={() => handleBackOrCancel("/mood-boards")}
        onSaveDraft={handleSaveDraft}
        onCreate={handleCreate}
        isSaving={isSaving}
      />

      {/* Main Two-Column Layout (Frame 2147225223) */}
      <div className="mb-editor-columns-grid">
        {/* Left Configuration Column (Frame 2147225221: Basic Details, Categories, Items) */}
        <div className="mb-left-config-column">
          {/* Section 1: Basic Details (Frame 2147225071) */}
          <MoodBoardBasicDetails
            name={name}
            projectId={projectId}
            leadId={leadId}
            description={description}
            onNameChange={handleNameChange}
            onProjectChange={handleProjectChange}
            onLeadChange={handleLeadChange}
            onDescriptionChange={handleDescriptionChange}
            errors={errors}
          />

          {/* Section 2: Categories (Frame 2147225617) */}
          <MoodBoardCategories
            categories={categories}
            activeCategoryId={activeCategoryId}
            onSelectCategory={handleSelectCategory}
            onToggleExpand={handleToggleExpand}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            onRenameCategory={handleRenameCategory}
            onReorderCategories={handleReorderCategories}
            activeGroupId={activeGroupId}
            onSelectGroup={(gId) => setActiveGroupId(gId)}
          />

          {/* Section 3: Items (Frame 2147225126) */}
          <MoodBoardItems
            category={activeCategory}
            activeGroupId={activeGroupId}
            onSelectGroup={(gId) => setActiveGroupId(gId)}
            onAddItem={handleAddItem}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
          />
        </div>

        {/* Right Preview Column (Frame 2147225071: Mood Board Preview & Summary) */}
        <div className="mb-right-preview-column">
          <MoodBoardPreview
            name={name}
            projectName={currentProject?.name || ""}
            leadName={currentLead?.name || ""}
            description={description}
            categories={categories}
            activeCategory={activeCategory}
            coverImage={coverImage}
            onSetCoverImage={(url) => setCoverImage(url)}
            onAddImagesToCategory={handleAddImagesToCategory}
            onRemoveImageFromCategory={handleRemoveImageFromCategory}
            onChangeTemplate={() => setIsTemplateModalOpen(true)}
          />
        </div>
      </div>

      {/* Unsaved Changes Confirmation Dialog */}
      <UnsavedChangesDialog
        isOpen={isUnsavedOpen}
        onClose={() => setIsUnsavedOpen(false)}
        onConfirmLeave={() => {
          setIsUnsavedOpen(false);
          if (pendingNavigation) router.push(pendingNavigation);
        }}
        onSaveDraftAndLeave={() => {
          handleSaveDraft();
          setIsUnsavedOpen(false);
          if (pendingNavigation) router.push(pendingNavigation);
        }}
      />

      {/* Change Template Modal / Drawer */}
      {isTemplateModalOpen && (
        <div
          className="new-mb-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-tpl-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsTemplateModalOpen(false);
          }}
        >
          <div className="mb-change-template-dialog">
            <MoodBoardTemplateSelection
              onSelectTemplate={handleApplyTemplate}
              onSwitchToBlank={() => setIsTemplateModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toast && (
        <div className="mb-toast" role="status" aria-live="polite">
          {toast.type === "success" ? (
            <CheckCircle2 size={18} className="mb-toast-success-icon" />
          ) : (
            <AlertCircle size={18} className="mb-toast-error-icon" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
