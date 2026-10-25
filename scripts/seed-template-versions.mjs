import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const envLines = fs.readFileSync(".env.local", "utf8").split("\n");
const env = {};
for (const line of envLines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx !== -1) {
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
  }
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY
);

const WORKSPACE_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const TEMPLATE_ID = "e1000000-0000-4000-8000-000000000001";
const USER_ID = "6a333eed-df69-4118-ac9f-89c4f1c54ecc";

const figmaVersions = [
  {
    id: "e2000000-0000-4000-8000-000000000006",
    workspace_id: WORKSPACE_ID,
    template_id: TEMPLATE_ID,
    version: 6,
    change_note: "Updated workflow & approvals",
    created_by: USER_ID,
    created_at: "2026-08-12T09:42:00Z",
    snapshot: {
      templateId: TEMPLATE_ID,
      templateCode: "TEM-RES-2938",
      name: "Premium 3BHK Residential",
      versionLabel: "v3.3",
      status: "DRAFT",
      summaryTitle: "Updated workflow & approvals",
      summarySubtitle: "Added 3 tasks and 2 approval rules",
      createdByName: "Pradhyumn D",
      publishedByName: null,
      publishedAt: null,
      projectsCount: 0,
      changesCount: 23,
      impact: "HIGH",
      areasCount: 8,
      boqSectionsCount: 18,
      workflowStagesCount: 7,
      documentsCount: 6,
    },
  },
  {
    id: "e2000000-0000-4000-8000-000000000005",
    workspace_id: WORKSPACE_ID,
    template_id: TEMPLATE_ID,
    version: 5,
    change_note: "Updated BOQ Rates",
    created_by: USER_ID,
    created_at: "2026-08-02T10:21:00Z",
    snapshot: {
      templateId: TEMPLATE_ID,
      templateCode: "TEM-RES-2938",
      name: "Premium 3BHK Residential",
      versionLabel: "v3.2",
      status: "PUBLISHED",
      summaryTitle: "Updated BOQ Rates",
      summarySubtitle: "Updated rates & commercial defaults",
      createdByName: "Admin User",
      publishedByName: "Pradhyumn D",
      publishedAt: "2026-08-06T14:32:00Z",
      projectsCount: 18,
      changesCount: 27,
      impact: "HIGH",
      areasCount: 8,
      boqSectionsCount: 18,
      workflowStagesCount: 6,
      documentsCount: 6,
    },
  },
  {
    id: "e2000000-0000-4000-8000-000000000004",
    workspace_id: WORKSPACE_ID,
    template_id: TEMPLATE_ID,
    version: 4,
    change_note: "Added milestone workflow",
    created_by: USER_ID,
    created_at: "2026-07-22T16:42:00Z",
    snapshot: {
      templateId: TEMPLATE_ID,
      templateCode: "TEM-RES-2938",
      name: "Premium 3BHK Residential",
      versionLabel: "v3.1",
      status: "SUPERSEDED",
      summaryTitle: "Added milestone workflow",
      summarySubtitle: "Added milestones & task dependencies",
      createdByName: "Diptish Gohane",
      publishedByName: "Pradhyumn D",
      publishedAt: "2026-07-28T11:05:00Z",
      projectsCount: 14,
      changesCount: 16,
      impact: "MEDIUM",
      areasCount: 8,
      boqSectionsCount: 16,
      workflowStagesCount: 6,
      documentsCount: 5,
    },
  },
  {
    id: "e2000000-0000-4000-8000-000000000003",
    workspace_id: WORKSPACE_ID,
    template_id: TEMPLATE_ID,
    version: 3,
    change_note: "Major template restructure",
    created_by: USER_ID,
    created_at: "2026-07-08T09:30:00Z",
    snapshot: {
      templateId: TEMPLATE_ID,
      templateCode: "TEM-RES-2938",
      name: "Premium 3BHK Residential",
      versionLabel: "v3.0",
      status: "ARCHIVED",
      summaryTitle: "Major template restructure",
      summarySubtitle: "Restructured areas & sections",
      createdByName: "Pradhyumn D",
      publishedByName: "Pradhyumn D",
      publishedAt: "2026-07-14T15:10:00Z",
      projectsCount: 10,
      changesCount: 41,
      impact: "HIGH",
      areasCount: 8,
      boqSectionsCount: 14,
      workflowStagesCount: 5,
      documentsCount: 5,
    },
  },
  {
    id: "e2000000-0000-4000-8000-000000000002",
    workspace_id: WORKSPACE_ID,
    template_id: TEMPLATE_ID,
    version: 2,
    change_note: "Initial workflow configuration",
    created_by: USER_ID,
    created_at: "2026-06-26T14:11:00Z",
    snapshot: {
      templateId: TEMPLATE_ID,
      templateCode: "TEM-RES-2938",
      name: "Premium 3BHK Residential",
      versionLabel: "v2.5",
      status: "ARCHIVED",
      summaryTitle: "Initial workflow configuration",
      summarySubtitle: "Initial stages, tasks & approvals",
      createdByName: "Admin User",
      publishedByName: "Pradhyumn D",
      publishedAt: "2026-06-30T10:22:00Z",
      projectsCount: 6,
      changesCount: 19,
      impact: "MEDIUM",
      areasCount: 6,
      boqSectionsCount: 12,
      workflowStagesCount: 5,
      documentsCount: 4,
    },
  },
  {
    id: "e2000000-0000-4000-8000-000000000001",
    workspace_id: WORKSPACE_ID,
    template_id: TEMPLATE_ID,
    version: 1,
    change_note: "Initial template release",
    created_by: USER_ID,
    created_at: "2026-06-15T11:08:00Z",
    snapshot: {
      templateId: TEMPLATE_ID,
      templateCode: "TEM-RES-2938",
      name: "Premium 3BHK Residential",
      versionLabel: "v2.0",
      status: "ARCHIVED",
      summaryTitle: "Initial template release",
      summarySubtitle: "Base template with core structure",
      createdByName: "Admin User",
      publishedByName: "Pradhyumn D",
      publishedAt: "2026-06-20T17:45:00Z",
      projectsCount: 4,
      changesCount: 32,
      impact: "HIGH",
      areasCount: 5,
      boqSectionsCount: 10,
      workflowStagesCount: 4,
      documentsCount: 3,
    },
  },
];

async function seed() {
  console.log("Upserting Figma versions for template:", TEMPLATE_ID);
  for (const v of figmaVersions) {
    const { error } = await supabase
      .from("project_template_versions")
      .upsert(v, { onConflict: "id" });
    if (error) {
      console.error("Error upserting version", v.snapshot.versionLabel, error);
    } else {
      console.log("Seeded version:", v.snapshot.versionLabel, "version number:", v.version);
    }
  }

  // Also ensure template current_version is set to 5 (v3.2) or 3
  await supabase
    .from("project_templates")
    .update({ current_version: 5 })
    .eq("id", TEMPLATE_ID);
  console.log("Updated template current_version to 5");
}

seed();
