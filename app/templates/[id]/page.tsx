"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import DashboardRail from "@/components/DashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import TemplateInfoCard from "@/components/templates/detail/TemplateInfoCard";
import TemplateDetailTabs, {
  DetailTabType,
} from "@/components/templates/detail/TemplateDetailTabs";
import TemplateOverview from "@/components/templates/detail/TemplateOverview";
import TemplateStructure from "@/components/templates/detail/TemplateStructure";
import TemplateCostingBoq from "@/components/templates/detail/TemplateCostingBoq";
import TemplateWorkflow from "@/components/templates/detail/TemplateWorkflow";
import TemplateDocuments from "@/components/templates/detail/TemplateDocuments";
import TemplateUsage from "@/components/templates/detail/TemplateUsage";
import TemplateVersions from "@/components/templates/detail/TemplateVersions";
import TemplateActivity from "@/components/templates/detail/TemplateActivity";
import UseTemplateModal from "@/components/templates/detail/UseTemplateModal";
import { getTemplate, duplicateProjectTemplate } from "@/lib/api/templates";
import {
  mockProjectTemplates,
  mockAreas,
  mockBoqItems,
  USE_TEMPLATE_MOCKS,
} from "@/lib/templates/mock-data";

export default function TemplateDetailPage() {
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId as string) || "";
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab");
  const subtabParam = searchParams?.get("subtab");

  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTabType>(() => {
    if (tabParam) {
      const match = (["Overview", "Structure", "Costing & BOQ", "Workflow", "Documents", "Usage", "Versions", "Activity"] as DetailTabType[]).find(
        (t) => t.toLowerCase() === tabParam.toLowerCase()
      );
      if (match) return match;
    }
    return "Overview";
  });
  const [isUseModalOpen, setIsUseModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (tabParam) {
      const match = (["Overview", "Structure", "Costing & BOQ", "Workflow", "Documents", "Usage", "Versions", "Activity"] as DetailTabType[]).find(
        (t) => t.toLowerCase() === tabParam.toLowerCase()
      );
      if (match) setActiveTab(match);
    }
  }, [tabParam]);

  const fetchTemplateData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);

      // If mock mode is explicitly turned on in development, use mock template
      if (USE_TEMPLATE_MOCKS) {
        const found =
          mockProjectTemplates.find((m) => m.id === id) || mockProjectTemplates[0];
        setTemplate(found);
        return;
      }

      // Real backend fetch
      const res = await getTemplate(id);
      if (res) {
        setTemplate(res);
      } else {
        // Fallback to mock template 1 if not found in dev
        if (process.env.NODE_ENV === "development") {
          setTemplate(mockProjectTemplates[0]);
        } else {
          setError("Template not found");
        }
      }
    } catch (err: unknown) {
      if (process.env.NODE_ENV === "development") {
        // Provide mock template fallback during dev if backend lacks this specific ID
        const found =
          mockProjectTemplates.find((m) => m.id === id) || mockProjectTemplates[0];
        setTemplate(found);
      } else {
        const msg = err instanceof Error ? err.message : "Failed to load template.";
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTemplateData();
  }, [fetchTemplateData]);

  const handleDuplicate = async () => {
    if (!template?.id) return;
    try {
      await duplicateProjectTemplate(template.id);
      setNotice(`Template "${template.name}" duplicated successfully.`);
      setTimeout(() => setNotice(null), 4000);
      router.push("/templates");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to duplicate.";
      alert(msg);
    }
  };

  const handleEdit = () => {
    if (!template?.id) return;
    router.push(`/templates/new?edit=${template.id}`);
  };

  const handleUseTemplate = () => {
    setIsUseModalOpen(true);
  };

  return (
    <main className="fig-dashboard boq-dashboard">
      <div className="fig-dashboard-glow" />
      <DashboardRail current="/templates" />

      <div className="fig-dashboard-main">
        {/* Parent Global Dashboard Header */}
        <DashboardHeader
          title="Templates"
          onNew={() => router.push("/templates/new")}
        />

        <div className="td-page-shell">
          {/* Back Navigation Link */}
          <button
            type="button"
            className="td-back-link"
            onClick={() => router.push("/templates")}
          >
            <ArrowLeft size={16} />
            <span>Project Templates</span>
          </button>

          {notice && (
            <div
              className="td-inspector-alert success"
              style={{ marginBottom: 16 }}
            >
              <span>{notice}</span>
            </div>
          )}

          {/* Loading Skeleton State */}
          {loading && (
            <div className="td-loading-skeleton">
              <div
                className="template-card-skeleton skeleton-shimmer"
                style={{ height: 180, marginBottom: 24, borderRadius: 14 }}
              />
              <div
                className="template-card-skeleton skeleton-shimmer"
                style={{ height: 44, marginBottom: 24, borderRadius: 8 }}
              />
              <div
                className="template-card-skeleton skeleton-shimmer"
                style={{ height: 380, borderRadius: 12 }}
              />
            </div>
          )}

          {/* Error State */}
          {!loading && error && !template && (
            <div
              className="td-card"
              style={{ padding: 48, textAlign: "center" }}
            >
              <AlertCircle
                size={40}
                className="text-red-500"
                style={{ margin: "0 auto 12px auto" }}
              />
              <h3 style={{ fontSize: 16, margin: "0 0 8px 0" }}>
                Unable to load template
              </h3>
              <p
                style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px 0" }}
              >
                {error}
              </p>
              <button
                type="button"
                className="td-add-structure-btn"
                style={{ width: "auto", margin: "0 auto", padding: "8px 20px" }}
                onClick={fetchTemplateData}
              >
                <RefreshCw size={14} />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Main Content */}
          {!loading && template && (
            <>
              {/* Template Information Card */}
              <TemplateInfoCard
                template={template}
                onDuplicate={handleDuplicate}
                onEdit={handleEdit}
                onUseTemplate={handleUseTemplate}
                onImageUploaded={(url) => {
                  setTemplate((prev: any) => ({ ...prev, imageUrl: url }));
                }}
              />

              {/* Tabs Bar & Actions */}
              <TemplateDetailTabs
                activeTab={activeTab}
                onChangeTab={setActiveTab}
                onDuplicate={handleDuplicate}
                onEdit={handleEdit}
                onUseTemplate={handleUseTemplate}
              />

              {/* Active Tab View */}
              {activeTab === "Overview" && (
                <TemplateOverview
                  template={template}
                  onViewUsageAnalytics={() => setActiveTab("Usage")}
                />
              )}

              {activeTab === "Structure" && (
                <TemplateStructure
                  templateId={template.id}
                  initialAreas={template.structure?.areas || mockAreas}
                  onUpdate={fetchTemplateData}
                />
              )}

              {activeTab === "Costing & BOQ" && (
                <TemplateCostingBoq
                  templateId={template.id}
                  initialItems={template.costingBoq?.items || mockBoqItems}
                  onUpdate={fetchTemplateData}
                />
              )}

              {activeTab === "Workflow" && (
                <TemplateWorkflow
                  templateId={template.id}
                  templateName={template.name}
                  initialWorkflow={template.workflow}
                  initialSubTab={subtabParam?.toLowerCase() === "rules" ? "Rules" : "Rules"}
                  onUpdate={fetchTemplateData}
                />
              )}

              {activeTab === "Documents" && (
                <TemplateDocuments
                  templateId={template.id}
                  initialDocuments={template.documents}
                  onUpdate={fetchTemplateData}
                />
              )}

              {activeTab === "Usage" && (
                <TemplateUsage
                  templateId={template.id}
                  useCount={template.useCount}
                  lastUsedAt={template.lastUsedAt}
                />
              )}

              {activeTab === "Versions" && (
                <TemplateVersions
                  templateId={template.id}
                  currentVersion={template.version}
                  onUpdate={fetchTemplateData}
                />
              )}

              {activeTab === "Activity" && (
                <TemplateActivity templateId={template.id} />
              )}
            </>
          )}
        </div>
      </div>

      {/* Use Template Modal */}
      {isUseModalOpen && template && (
        <UseTemplateModal
          template={{ id: template.id, name: template.name }}
          onClose={() => setIsUseModalOpen(false)}
        />
      )}
    </main>
  );
}
