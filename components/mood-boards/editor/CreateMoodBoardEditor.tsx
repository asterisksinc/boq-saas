"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle, ChevronRight } from "lucide-react";
import {
  MoodBoard,
  MoodBoardCategory,
  MoodBoardImage,
  MoodBoardTemplate,
  MoodBoardTemplateLayout,
} from "@/lib/mood-boards/types";
import {
  MOCK_PROJECTS,
  MOCK_CLIENTS,
  MOCK_LEADS,
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
import MoodBoardPreview from "./MoodBoardPreview";
import MoodBoardReviewStep from "./MoodBoardReviewStep";
import MoodBoardCompleteStep from "./MoodBoardCompleteStep";
import UnsavedChangesDialog from "./UnsavedChangesDialog";

export interface CreateMoodBoardEditorProps {
  initialTemplate?: MoodBoardTemplate | null;
  mode?: "blank" | "template";
}

function createInitialCleanCategories(): MoodBoardCategory[] {
  return [
    {
      id: "cat-bedroom",
      name: "Bedroom",
      expanded: true,
      imageCount: 0,
      images: [],
      position: 0,
    },
    {
      id: "cat-living",
      name: "Living Room",
      expanded: false,
      imageCount: 0,
      images: [],
      position: 1,
    },
    {
      id: "cat-materials",
      name: "Materials",
      expanded: false,
      imageCount: 0,
      images: [],
      position: 2,
    },
  ];
}

export default function CreateMoodBoardEditor({
  initialTemplate = null,
  mode = "blank",
}: CreateMoodBoardEditorProps) {
  const router = useRouter();

  // Workflow Step State (1: Add Content, 2: Review, 3: Complete)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Core Form State
  const [name, setName] = useState(
    initialTemplate ? `${initialTemplate.name} Concept` : ""
  );
  const [projectId, setProjectId] = useState(MOCK_PROJECTS[0]?.id || "");
  const [clientId, setClientId] = useState(
    MOCK_PROJECTS[0]?.defaultClientId || MOCK_CLIENTS[0]?.id || ""
  );
  const [leadId, setLeadId] = useState(MOCK_LEADS[0]?.id || "");
  const [description, setDescription] = useState(
    initialTemplate?.description || ""
  );

  // Selected Template Layout (grid-4x4, collage, modern, minimal, magazine, split)
  const [selectedTemplate, setSelectedTemplate] =
    useState<MoodBoardTemplateLayout>("grid-4x4");

  // Categories & Image Collection State
  const [categories, setCategories] = useState<MoodBoardCategory[]>(() => {
    if (initialTemplate && initialTemplate.images && initialTemplate.images.length > 0) {
      return [
        {
          id: `cat-template-primary`,
          name: initialTemplate.category || "Design Palette",
          expanded: true,
          imageCount: initialTemplate.images.length,
          images: initialTemplate.images.map((img, idx) => ({
            ...img,
            title: img.title || img.name,
            position: idx,
          })),
          position: 0,
        },
        {
          id: "cat-materials",
          name: "Materials & Finishes",
          expanded: false,
          imageCount: 0,
          images: [],
          position: 1,
        },
      ];
    }
    return createInitialCleanCategories();
  });

  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    categories[0]?.id || "cat-bedroom"
  );

  // Cover image
  const [coverImage, setCoverImage] = useState<string>(
    initialTemplate?.coverImage || ""
  );

  // Validation errors
  const [errors, setErrors] = useState<{
    name?: string;
    project?: string;
    client?: string;
  }>({});

  // UI state
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUnsavedOpen, setIsUnsavedOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [createdMoodBoard, setCreatedMoodBoard] = useState<MoodBoard | null>(null);

  // Toast state
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

  // Restore draft if available on blank mode
  useEffect(() => {
    if (!initialTemplate) {
      const draft = loadDraftMoodBoard();
      if (draft && draft.name) {
        setName(draft.name || "");
        if (draft.projectId) setProjectId(draft.projectId);
        if (draft.clientId) setClientId(draft.clientId);
        if (draft.leadId) setLeadId(draft.leadId);
        if (draft.description) setDescription(draft.description);
        if (draft.selectedTemplate) setSelectedTemplate(draft.selectedTemplate);
        if (draft.categories && draft.categories.length > 0) {
          setCategories(draft.categories);
          setActiveCategoryId(draft.categories[0].id);
        }
        if (draft.coverImage) setCoverImage(draft.coverImage);
        if (draft.step) setCurrentStep(draft.step);
      }
    }
  }, [initialTemplate]);

  // Derived Project and Client References
  const currentProject = useMemo(() => {
    return MOCK_PROJECTS.find((p) => p.id === projectId) || MOCK_PROJECTS[0];
  }, [projectId]);

  const currentClient = useMemo(() => {
    return (
      MOCK_CLIENTS.find((c) => c.id === clientId) ||
      MOCK_CLIENTS.find((c) => c.id === currentProject?.defaultClientId) ||
      MOCK_CLIENTS[0]
    );
  }, [clientId, currentProject]);

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
        expanded: true,
      }
    );
  }, [categories, activeCategoryId]);

  // Handlers for Basic Details
  const handleNameChange = (val: string) => {
    setName(val);
    setIsDirty(true);
    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
  };

  const handleProjectChange = (val: string) => {
    setProjectId(val);
    setIsDirty(true);
    if (errors.project) setErrors((prev) => ({ ...prev, project: undefined }));

    // Automatically associate client if matching project has a default client
    const matched = MOCK_PROJECTS.find((p) => p.id === val);
    if (matched && matched.defaultClientId) {
      setClientId(matched.defaultClientId);
      if (errors.client) setErrors((prev) => ({ ...prev, client: undefined }));
    }
  };

  const handleClientChange = (val: string) => {
    setClientId(val);
    setIsDirty(true);
    if (errors.client) setErrors((prev) => ({ ...prev, client: undefined }));
  };

  const handleDescriptionChange = (val: string) => {
    setDescription(val);
    setIsDirty(true);
  };

  // Category Actions
  const handleSelectCategory = (id: string) => {
    setActiveCategoryId(id);
  };

  const handleToggleExpand = (id: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, expanded: !c.expanded } : c))
    );
  };

  const handleAddCategory = (newCategoryName: string, desc?: string) => {
    const newCat: MoodBoardCategory = {
      id: `cat-${generateId()}`,
      name: newCategoryName,
      description: desc,
      expanded: true,
      imageCount: 0,
      images: [],
      position: categories.length,
    };
    setCategories((prev) => [...prev, newCat]);
    setActiveCategoryId(newCat.id);
    setIsDirty(true);
    showToast(`Category "${newCategoryName}" created.`);
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
    const reindexed = newOrder.map((c, i) => ({ ...c, position: i }));
    setCategories(reindexed);
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

    if (!coverImage && newImages.length > 0) {
      setCoverImage(newImages[0].previewUrl);
    }

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

  const handleUpdateImageTitle = (
    categoryId: string,
    imageId: string,
    newTitle: string
  ) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== categoryId) return cat;
        const updatedImages = (cat.images || []).map((img) =>
          img.id === imageId
            ? { ...img, title: newTitle, name: newTitle }
            : img
        );
        return {
          ...cat,
          images: updatedImages,
        };
      })
    );
    setIsDirty(true);
    showToast("Image title updated.");
  };

  const handleReplaceImage = (
    categoryId: string,
    imageId: string,
    newImg: MoodBoardImage
  ) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== categoryId) return cat;
        const updatedImages = (cat.images || []).map((img) =>
          img.id === imageId
            ? {
                ...img,
                previewUrl: newImg.previewUrl,
                originalFileName: newImg.originalFileName,
                fileType: newImg.fileType,
                size: newImg.size,
              }
            : img
        );
        return {
          ...cat,
          images: updatedImages,
        };
      })
    );
    setIsDirty(true);
    showToast("Image replaced successfully.");
  };

  // Template Change Handler
  const handleSelectTemplate = (tpl: MoodBoardTemplateLayout) => {
    setSelectedTemplate(tpl);
    setIsDirty(true);
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
      name: name.trim() || "Untitled Moodboard",
      projectId,
      clientId,
      leadId,
      description: description.trim(),
      selectedTemplate,
      categories,
      coverImage,
      step: currentStep,
      savedAt: new Date().toISOString(),
    };

    saveDraftMoodBoard(draftData);
    setIsDirty(false);
    showToast("Draft saved successfully to local storage.");
  };

  // Validation Before Proceeding to Review
  const validateBeforeReview = (): boolean => {
    const newErrors: { name?: string; project?: string; client?: string } = {};

    if (!name.trim()) {
      newErrors.name = "Moodboard name is required";
    }
    if (!projectId) {
      newErrors.project = "Please select a project";
    }
    if (!clientId) {
      newErrors.client = "Please select a client";
    }

    if (categories.length === 0) {
      showToast("Please add at least one category.", "error");
      return false;
    }

    // Check that every uploaded image has a title
    for (const cat of categories) {
      for (const img of cat.images || []) {
        if (!img.title || !img.title.trim()) {
          showToast(
            `Please provide a title for all images in category "${cat.name}".`,
            "error"
          );
          return false;
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast("Please fill in all required fields.", "error");
      return false;
    }

    return true;
  };

  const handleContinueToReview = () => {
    if (validateBeforeReview()) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Final Creation Handler (Step 2 -> Step 3)
  const handleCreate = async () => {
    if (!validateBeforeReview()) return;

    setIsSaving(true);
    try {
      // Collect all images from all categories
      const allCategoryImages = categories.reduce<MoodBoardImage[]>(
        (acc, c) => acc.concat(c.images || []),
        []
      );

      const created = await moodBoardRepository.create({
        name: name.trim(),
        projectId,
        projectName: currentProject?.name,
        clientId,
        clientName: currentClient?.name,
        clientSubtitle: currentClient?.subtitle,
        boqReference: currentProject?.boqReference || "BOQ-0029",
        leadId,
        leadName: currentLead?.name,
        description: description.trim(),
        mode,
        selectedTemplate,
        categories,
        coverImage: coverImage || allCategoryImages[0]?.previewUrl,
        images: allCategoryImages,
        status: "DRAFT",
        createdBy: currentLead?.name || "Jenny Wilson",
      });

      clearDraftMoodBoard();
      setIsDirty(false);
      setCreatedMoodBoard(created);
      setCurrentStep(3);
      showToast(`Moodboard "${created.name}" created successfully!`);
      // URL query for moodboards listing success modal integration
      const successQueryUrl = `/mood-boards?created=${created.id}`;
    } catch (err) {
      console.error(err);
      showToast("Failed to create moodboard. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to create another moodboard
  const handleResetForAnother = () => {
    clearDraftMoodBoard();
    setName("");
    setProjectId(MOCK_PROJECTS[0]?.id || "");
    setClientId(MOCK_PROJECTS[0]?.defaultClientId || MOCK_CLIENTS[0]?.id || "");
    setDescription("");
    setSelectedTemplate("grid-4x4");
    setCategories(createInitialCleanCategories());
    setActiveCategoryId("cat-bedroom");
    setCoverImage("");
    setErrors({});
    setIsDirty(false);
    setCreatedMoodBoard(null);
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="moodboard-create-container mb-create-editor-view">
      {/* Top Action Bar & 3-Step Progress Indicator */}
      <MoodBoardActionBar
        title="Create Moodboard"
        subtitle="Add categories, upload images, and organize your design inspiration."
        currentStep={currentStep}
        onStepClick={(targetStep) => {
          if (targetStep === 1) {
            setCurrentStep(1);
          } else if (targetStep === 2) {
            handleContinueToReview();
          }
        }}
        onBack={() => handleBackOrCancel("/mood-boards")}
        onCancel={() => handleBackOrCancel("/mood-boards")}
        onSaveDraft={handleSaveDraft}
        onContinueToReview={handleContinueToReview}
        onCreate={handleCreate}
        isSaving={isSaving}
      />

      {/* STEP 1: Add Content — Two-Column Layout */}
      {currentStep === 1 && (
        <div className="moodboard-content-grid mb-editor-columns-grid">
          {/* Left Panel: Configuration & Categories (529px at reference width) */}
          <div className="moodboard-left-panel mb-left-config-column">
            {/* Section 1: Basic Details */}
            <MoodBoardBasicDetails
              name={name}
              projectId={projectId}
              clientId={clientId}
              leadId={leadId}
              description={description}
              onNameChange={handleNameChange}
              onProjectChange={handleProjectChange}
              onClientChange={handleClientChange}
              onDescriptionChange={handleDescriptionChange}
              errors={errors}
            />

            {/* Section 2: Categories Management & Upload Accordion */}
            <MoodBoardCategories
              categories={categories}
              activeCategoryId={activeCategoryId}
              onSelectCategory={handleSelectCategory}
              onToggleExpand={handleToggleExpand}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
              onRenameCategory={handleRenameCategory}
              onReorderCategories={handleReorderCategories}
              onAddImagesToCategory={handleAddImagesToCategory}
              onRemoveImageFromCategory={handleRemoveImageFromCategory}
              onUpdateImageTitle={handleUpdateImageTitle}
              onReplaceImage={handleReplaceImage}
            />
          </div>

          {/* Right Panel: Live Moodboard Preview (781px at reference width) */}
          <div className="moodboard-right-panel mb-right-preview-column">
            <MoodBoardPreview
              name={name}
              projectName={currentProject?.name || ""}
              leadName={currentLead?.name || ""}
              clientName={currentClient?.name || ""}
              description={description}
              categories={categories}
              activeCategory={activeCategory}
              selectedTemplate={selectedTemplate}
              onSelectTemplate={handleSelectTemplate}
              onSelectCategory={handleSelectCategory}
              coverImage={coverImage}
              onSetCoverImage={(url) => setCoverImage(url)}
            />

          </div>
        </div>
      )}

      {/* STEP 2: Review — Complete Moodboard Overview */}
      {currentStep === 2 && (
        <MoodBoardReviewStep
          name={name}
          projectName={currentProject?.name || ""}
          clientName={currentClient?.name || ""}
          description={description}
          selectedTemplate={selectedTemplate}
          categories={categories}
          onBackToEdit={() => setCurrentStep(1)}
          onSaveDraft={handleSaveDraft}
          onCreate={handleCreate}
          isSaving={isSaving}
        />
      )}

      {/* STEP 3: Complete — Confirmation & Success Actions */}
      {currentStep === 3 && (
        <MoodBoardCompleteStep
          createdMoodBoard={createdMoodBoard}
          onReset={handleResetForAnother}
        />
      )}

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
