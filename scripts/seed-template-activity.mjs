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
const ADMIN_USER_ID = "6a333eed-df69-4118-ac9f-89c4f1c54ecc";

// Generate timestamps relative to today for dynamic dates:
const now = new Date();
const today1442 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 42, 0).toISOString();
const today1218 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 18, 0).toISOString();
const today1104 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 4, 0).toISOString();
const today0932 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 32, 0).toISOString();

const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
const yest1720 = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 17, 20, 0).toISOString();
const yest1505 = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 15, 5, 0).toISOString();
const yest1130 = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 11, 30, 0).toISOString();

const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
const threeDaysAgoTime = new Date(threeDaysAgo.getFullYear(), threeDaysAgo.getMonth(), threeDaysAgo.getDate(), 16, 0, 0).toISOString();

const figmaActivities = [
  // --- TODAY ---
  {
    workspace_id: WORKSPACE_ID,
    actor_user_id: ADMIN_USER_ID,
    action: "template.version.published",
    entity_type: "project_template",
    entity_id: TEMPLATE_ID,
    request_id: "req-act-001",
    created_at: today1442,
    metadata: {
      category: "publishing",
      statusPill: "VERSION PUBLISHED",
      statusPillType: "success",
      markerColor: "green",
      timeLabel: "14:42",
      actor: {
        id: "user-pd-01",
        name: "Pradhyumn Dhondi",
        role: "Creative Director",
        avatar: "/avatars/pradhyumn.png",
        initials: "PD",
      },
      title: "Published Version 3.4",
      description: "Premium 3BHK Residential is not using Version 3.4 on the active published template.",
      actionLink: {
        label: "View Version",
        href: `/templates/${TEMPLATE_ID}?tab=Versions`,
      },
      scopeBadges: [
        { label: "Versions", type: "category" },
        { label: "v3.4", type: "sub" }
      ],
      details: {
        action: "Published v3.4",
        previous: "Draft v3.4",
        newVal: "Published v3.4",
        changesIncluded: [
          { label: "Costing & BOQ Changes", count: 3, icon: "payment_card" },
          { label: "Workflow Changes", count: 2, icon: "arrow_split" },
          { label: "Document Changes", count: 1, icon: "docs" },
          { label: "Structure Changes", count: 2, icon: "data_table" }
        ],
        reason: "FY26 commercial and workflow update",
        versionLabel: "v3.4"
      }
    }
  },
  {
    workspace_id: WORKSPACE_ID,
    actor_user_id: ADMIN_USER_ID,
    action: "template.costing.rate_updated",
    entity_type: "project_template",
    entity_id: TEMPLATE_ID,
    request_id: "req-act-002",
    created_at: today1218,
    metadata: {
      category: "changes",
      statusPill: "RATE UPDATED",
      statusPillType: "warning",
      markerColor: "amber",
      timeLabel: "12:18",
      actor: {
        id: "user-dg-02",
        name: "Diptish Gohane",
        role: "Costing Manager",
        avatar: "/avatars/diptish.png",
        initials: "DG",
      },
      title: "updated Full Height Wardrobe",
      description: "Costing & BOQ → Master Bedroom → Furniture",
      diff: {
        rateSource: "Template Snapshot → Current Costing Library",
        rateValue: "₹2,850 / Sq.ft → ₹2,975 / Sq.ft",
      },
      actionLink: {
        label: "View Change",
        href: `/templates/${TEMPLATE_ID}?tab=Costing+%26+BOQ`,
      },
      scopeBadges: [
        { label: "Costing & BOQ", type: "category" },
        { label: "FUR-001", type: "sub" }
      ],
      details: {
        action: "Rate Update",
        previous: "₹2,850 / Sq.ft",
        newVal: "₹2,975 / Sq.ft",
        changesIncluded: [
          { label: "Costing & BOQ Changes", count: 1, icon: "payment_card" }
        ],
        reason: "Supplier raw material revision Q3",
        versionLabel: "v3.4 Draft"
      }
    }
  },
  {
    workspace_id: WORKSPACE_ID,
    actor_user_id: ADMIN_USER_ID,
    action: "template.workflow.task_added",
    entity_type: "project_template",
    entity_id: TEMPLATE_ID,
    request_id: "req-act-003",
    created_at: today1104,
    metadata: {
      category: "changes",
      statusPill: "TASK ADDED",
      statusPillType: "info",
      markerColor: "blue",
      timeLabel: "11:04",
      actor: {
        id: "user-dh-03",
        name: "Dhruv",
        role: "Workflow Specialist",
        avatar: "/avatars/dhruv.png",
        initials: "DH",
      },
      title: "added Workflow Task",
      description: "Workflow → Tasks • Client Material Approval",
      actionLink: {
        label: "View Version",
        href: `/templates/${TEMPLATE_ID}?tab=Workflow`,
      },
      scopeBadges: [
        { label: "Workflow", type: "category" },
        { label: "Stage: Procurement", type: "sub" }
      ],
      details: {
        action: "Task Added",
        previous: "6 Tasks",
        newVal: "7 Tasks",
        changesIncluded: [
          { label: "Workflow Changes", count: 1, icon: "arrow_split" }
        ],
        reason: "Required mandatory signoff step before ordering timber",
        versionLabel: "v3.4 Draft"
      }
    }
  },
  {
    workspace_id: WORKSPACE_ID,
    actor_user_id: ADMIN_USER_ID,
    action: "template.system.costing_synced",
    entity_type: "project_template",
    entity_id: TEMPLATE_ID,
    request_id: "req-act-004",
    created_at: today0932,
    metadata: {
      category: "system",
      statusPill: "COMPLETED",
      statusPillType: "neutral",
      markerColor: "blue",
      timeLabel: "09:32",
      actor: {
        id: "sys-00",
        name: "System",
        role: "Automated Event",
        avatar: null,
        initials: "SY",
      },
      title: "Costing Library Synchronisation Completed",
      description: "14 Costing Items were updated • 3 items require review",
      actionLink: {
        label: "View Version",
        href: `/templates/${TEMPLATE_ID}?tab=Costing+%26+BOQ`,
      },
      scopeBadges: [
        { label: "System", type: "category" }
      ],
      details: {
        action: "Automated Sync",
        previous: "Catalogue v12.1",
        newVal: "Catalogue v12.2",
        changesIncluded: [
          { label: "Costing & BOQ Changes", count: 14, icon: "payment_card" }
        ],
        reason: "Scheduled daily costing master sync",
        versionLabel: "v3.4 Draft"
      }
    }
  },

  // --- YESTERDAY ---
  {
    workspace_id: WORKSPACE_ID,
    actor_user_id: ADMIN_USER_ID,
    action: "template.usage.created_project",
    entity_type: "project_template",
    entity_id: TEMPLATE_ID,
    request_id: "req-act-005",
    created_at: yest1720,
    metadata: {
      category: "usage",
      statusPill: "PROJECT CREATED",
      statusPillType: "success",
      markerColor: "green",
      timeLabel: "17:20",
      actor: {
        id: "user-sj-04",
        name: "Sarah Jenkins",
        role: "Senior Project Manager",
        avatar: "/avatars/sarah.png",
        initials: "SJ",
      },
      title: "Created project from template",
      description: "Applied v3.3 to project 'The Imperial Crown Heights 402'",
      actionLink: {
        label: "View Usage",
        href: `/templates/${TEMPLATE_ID}?tab=Usage`,
      },
      scopeBadges: [
        { label: "Usage", type: "category" },
        { label: "PRJ-2026-003", type: "sub" }
      ],
      details: {
        action: "Use Template",
        previous: "41 Projects",
        newVal: "42 Projects",
        changesIncluded: [
          { label: "Usage Instances", count: 1, icon: "data_table" }
        ],
        reason: "Client onboarding & contract execution",
        versionLabel: "v3.3"
      }
    }
  },
  {
    workspace_id: WORKSPACE_ID,
    actor_user_id: ADMIN_USER_ID,
    action: "template.access.role_granted",
    entity_type: "project_template",
    entity_id: TEMPLATE_ID,
    request_id: "req-act-006",
    created_at: yest1505,
    metadata: {
      category: "access",
      statusPill: "ACCESS GRANTED",
      statusPillType: "info",
      markerColor: "purple",
      timeLabel: "15:05",
      actor: {
        id: "user-pd-01",
        name: "Pradhyumn Dhondi",
        role: "Creative Director",
        avatar: "/avatars/pradhyumn.png",
        initials: "PD",
      },
      title: "Granted editor access",
      description: "Assigned 'Editor' role to Rohit Verma for template revisions",
      actionLink: {
        label: "View Access",
        href: `/templates/${TEMPLATE_ID}?tab=Overview`,
      },
      scopeBadges: [
        { label: "Access", type: "category" },
        { label: "Editor", type: "sub" }
      ],
      details: {
        action: "Access Role Updated",
        previous: "Viewer",
        newVal: "Editor",
        changesIncluded: [
          { label: "Access Permissions", count: 1, icon: "docs" }
        ],
        reason: "Assigned to assist in Q3 BOQ updates",
        versionLabel: "v3.3"
      }
    }
  },
  {
    workspace_id: WORKSPACE_ID,
    actor_user_id: ADMIN_USER_ID,
    action: "template.documents.file_attached",
    entity_type: "project_template",
    entity_id: TEMPLATE_ID,
    request_id: "req-act-007",
    created_at: yest1130,
    metadata: {
      category: "changes",
      statusPill: "DOCUMENT UPLOADED",
      statusPillType: "info",
      markerColor: "blue",
      timeLabel: "11:30",
      actor: {
        id: "user-dg-02",
        name: "Diptish Gohane",
        role: "Costing Manager",
        avatar: "/avatars/diptish.png",
        initials: "DG",
      },
      title: "Uploaded Specification Sheet",
      description: "Documents → Master Bedroom Specifications v2.pdf",
      actionLink: {
        label: "View Document",
        href: `/templates/${TEMPLATE_ID}?tab=Documents`,
      },
      scopeBadges: [
        { label: "Documents", type: "category" },
        { label: "DOC-204", type: "sub" }
      ],
      details: {
        action: "Document Uploaded",
        previous: "DOC-204 v1",
        newVal: "DOC-204 v2",
        changesIncluded: [
          { label: "Document Changes", count: 1, icon: "docs" }
        ],
        reason: "Updated Italian Marble veneer technical spec",
        versionLabel: "v3.3"
      }
    }
  },

  // --- PREVIOUS / OLDER ---
  {
    workspace_id: WORKSPACE_ID,
    actor_user_id: ADMIN_USER_ID,
    action: "template.structure.room_added",
    entity_type: "project_template",
    entity_id: TEMPLATE_ID,
    request_id: "req-act-008",
    created_at: threeDaysAgoTime,
    metadata: {
      category: "changes",
      statusPill: "STRUCTURE MODIFIED",
      statusPillType: "warning",
      markerColor: "amber",
      timeLabel: "16:00",
      actor: {
        id: "user-pd-01",
        name: "Pradhyumn Dhondi",
        role: "Creative Director",
        avatar: "/avatars/pradhyumn.png",
        initials: "PD",
      },
      title: "Modified Room Structure",
      description: "Structure → Added 'Balcony Sit-out' to Master Bedroom Zone",
      actionLink: {
        label: "View Structure",
        href: `/templates/${TEMPLATE_ID}?tab=Structure`,
      },
      scopeBadges: [
        { label: "Structure", type: "category" },
        { label: "ZON-MBR", type: "sub" }
      ],
      details: {
        action: "Structure Node Added",
        previous: "7 Zones",
        newVal: "8 Zones",
        changesIncluded: [
          { label: "Structure Changes", count: 2, icon: "data_table" }
        ],
        reason: "Standard 3BHK layout upgrade for modern apartments",
        versionLabel: "v3.2"
      }
    }
  }
];

async function seed() {
  console.log("Seeding authentic template activity logs...");

  // Delete any existing activity for this template to ensure fresh state
  const { error: delErr } = await supabase
    .from("audit_logs")
    .delete()
    .eq("workspace_id", WORKSPACE_ID)
    .eq("entity_type", "project_template")
    .eq("entity_id", TEMPLATE_ID);

  if (delErr) {
    console.warn("Delete error (if any):", delErr.message);
  }

  // Insert figma activities
  const { data, error } = await supabase
    .from("audit_logs")
    .insert(figmaActivities)
    .select("id, action, created_at");

  if (error) {
    console.error("Insert error:", error);
    process.exit(1);
  }

  console.log(`Successfully seeded ${data.length} activity records into audit_logs!`);
}

seed();
