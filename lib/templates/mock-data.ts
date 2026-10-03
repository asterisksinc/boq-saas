/**
 * Mock data fixtures for development and visual validation of Project Template Detail UI.
 *
 * NOTE: These mock fixtures are strictly for development / visual testing.
 * When NEXT_PUBLIC_TEMPLATE_UI_MOCKS="true" (or in dev with missing backend fields),
 * they provide reference-accurate shapes so the layout can be verified.
 * Production uses the real Supabase / Postgres backend APIs.
 */

export const USE_TEMPLATE_MOCKS =
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_TEMPLATE_UI_MOCKS === "true";

export interface MockItem {
  id: string;
  name: string;
  code: string;
  type: string;
  unit: string;
  quantity?: number;
  baseCost: number;
  sellingRate: number;
  rate?: number;
  wastePercent?: number;
  taxPercent?: number;
  amount?: number;
  rateStatus?: "MAPPED" | "OUTDATED" | "MISSING";
  description?: string;
}

export interface MockSection {
  id: string;
  name: string;
  code?: string;
  description?: string;
  itemsCount?: number;
  totalValue?: number;
  items: MockItem[];
}

export interface MockArea {
  id: string;
  name: string;
  type: string;
  dimensions: string;
  code?: string;
  description?: string;
  includedByDefault?: boolean;
  allowRename?: boolean;
  requiredArea?: boolean;
  sections: MockSection[];
}

export interface MockWorkflowTask {
  id: string;
  name: string;
  stage?: string;
  assignee: string;
  assigneeRole?: string;
  duration: string;
  dependency: string;
  criticality?: "MEDIUM" | "HIGH" | "CRITICAL";
  status?: "ACTIVE" | "COMPLETED" | "DRAFT";
  approval?: "Yes" | "No";
  order?: number;
}

export interface MockMilestone {
  id: string;
  code: string;
  orderNumber: string; // "01", "02", etc.
  name: string;
  subtitle: string;
  description?: string;
  category: string;
  ownerRole: string;
  duration: string;
  durationDays: number;
  tasksCount: number;
  deliverablesCount: number;
  approvalType: string;
  status: "CONFIGURED" | "DRAFT" | "PENDING";
  startRule?: string;
  completionRule?: string;
  linkedTasks?: number;
  linkedDeliverables?: number;
  linkedApprovals?: string;
  linkedDependencies?: number;
  nextMilestoneTitle?: string;
  nextMilestoneCode?: string;
}

export interface MockApprover {
  label: string;
  role: string;
  color: "red" | "green" | "blue" | "amber" | "gray";
}

export interface MockApprovalStepPreview {
  badge?: string;
  header?: string;
  title: string;
  subtitle: string;
}

export interface MockApprovalFlow {
  id: string;
  code: string;
  name: string;
  category: string;
  version: string;
  description: string;
  triggerTitle: string;
  triggerDescription: string;
  stagesCount: number;
  mode: "Sequential" | "Parallel";
  sla: string;
  status: "ACTIVE" | "DRAFT" | "NEEDS ATTENTION";
  createdBy: string;
  createdAt: string;
  lastUpdated: string;
  lastUpdatedBy: string;
  approvers: MockApprover[];
  previewSteps: MockApprovalStepPreview[];
}

export interface MockWorkflowRule {
  id: string;
  code: string;
  name: string;
  trigger: string;
  condition: string;
  action: string;
  stage: string;
  status: "ACTIVE" | "INACTIVE";
  lastModified: string;
}

export interface MockWorkflowStage {
  id: string;
  name: string;
  code: string;
  description: string;
  status: "ACTIVE" | "COMPLETED" | "DRAFT";
  owner: string;
  duration: number;
  durationUnit: string;
  entryCondition: string;
  exitCondition: string;
  tasksCount: number;
  milestonesCount: number;
  approvalsCount: number;
  tasks: MockWorkflowTask[];
}

export interface MockDocument {
  id: string;
  name: string;
  type: string;
  status: string;
  version: string;
  updatedAt: string;
  format: string;
}

export interface MockVersion {
  id: string;
  version: string;
  status: string;
  publishedAt: string;
  publishedBy: string;
  changeNote: string;
  createdAt: string;
}

export interface MockUsageRecord {
  id: string;
  projectName: string;
  clientName: string;
  location: string;
  usedAt: string;
  status: string;
}

export interface MockActivityRecord {
  id: string;
  action: string;
  description: string;
  actor: string;
  timestamp: string;
}

// ── 1. Two Mock Project Templates ───────────────────────────────────

export const mockProjectTemplates = [
  {
    id: "mock-template-1",
    templateCode: "TEM-RES-2938",
    name: "Premium 3BHK Residential",
    description:
      "Standard premium 3BHK interior project structure with predefined rooms, BOQ sections, costing references, milestones and client document requirements.",
    businessType: "Residential",
    projectType: "3BHK",
    team: "Residential Design",
    region: "India",
    visibility: "workspace",
    imageUrl: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80",
    tags: ["Residential", "Interior Design", "3BHK"],
    status: "ACTIVE",
    version: "v3.2",
    useCount: 42,
    lastUsedAt: "2026-08-18T10:30:00Z",
    publishedAt: "2026-07-06T10:30:00Z",
    createdBy: "usr-admin-1",
    updatedBy: "Pradhyumn D",
    createdAt: "2026-07-12T09:00:00Z",
    updatedAt: "2026-08-06T10:30:00Z",
    composition: {
      rooms: 8,
      boqSections: 18,
      items: 186,
      milestones: 6,
      documents: 4,
      approvals: 5,
      stages: 7,
      tasks: 48,
      rules: 4,
      categories: 7,
      paymentStages: 3,
      teamsUsing: 2,
    },
  },
  {
    id: "mock-template-2",
    templateCode: "TEM-VIL-4012",
    name: "Luxury Villa Turnkey",
    description:
      "End-to-end turnkey architectural and interior design framework for premium villas with civil works, joinery, and MEP automation.",
    businessType: "Villa",
    projectType: "Villa",
    team: "Architecture & Luxury",
    region: "India",
    visibility: "workspace",
    imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
    tags: ["Villa", "Luxury", "Turnkey"],
    status: "DRAFT",
    version: "v2.4",
    useCount: 18,
    lastUsedAt: "2026-08-10T14:20:00Z",
    publishedAt: "2026-06-20T10:30:00Z",
    createdBy: "usr-admin-2",
    updatedBy: "Sarah Jenkins",
    createdAt: "2026-06-20T08:00:00Z",
    updatedAt: "2026-08-04T12:00:00Z",
    composition: {
      rooms: 12,
      boqSections: 24,
      items: 248,
      milestones: 8,
      documents: 6,
      approvals: 7,
      stages: 8,
      tasks: 64,
      rules: 6,
      categories: 9,
      paymentStages: 4,
      teamsUsing: 3,
    },
  },
];

// ── 2. Two Mock Areas ──────────────────────────────────────────────

export const mockAreas: MockArea[] = [
  {
    id: "area-master-bedroom",
    name: "Master Bedroom",
    type: "Bedroom",
    dimensions: "16ft x 14ft",
    code: "BED-MST",
    description: "Master bedroom with attached walk-in wardrobe and ensuite bath.",
    includedByDefault: true,
    allowRename: true,
    requiredArea: true,
    sections: [
      {
        id: "sec-furniture",
        name: "Furniture",
        code: "SEC-FUR-01",
        description: "Wardrobes, bed console, dressers and bedside tables",
        itemsCount: 11,
        totalValue: 482000,
        items: [
          {
            id: "itm-wardrobe",
            name: "Full Height Wardrobe",
            code: "MAT-BRD-001",
            type: "Material",
            unit: "Sq.ft",
            quantity: 72,
            baseCost: 2200,
            sellingRate: 2875,
            rate: 2875,
            wastePercent: 5,
            taxPercent: 18,
            amount: 227736,
            rateStatus: "MAPPED",
            description: "19mm BWP ply, laminate finish",
          },
          {
            id: "itm-bed",
            name: "King Size Bed",
            code: "MAT-BRD-002",
            type: "Material",
            unit: "Nos",
            quantity: 1,
            baseCost: 38000,
            sellingRate: 45800,
            rate: 45800,
            wastePercent: 0,
            taxPercent: 18,
            amount: 54044,
            rateStatus: "MAPPED",
            description: "Upholstered headboard with hydraulic storage",
          },
        ],
      },
      {
        id: "sec-electrical",
        name: "Electrical",
        code: "SEC-ELE-01",
        description: "Concealed electrical conduit, light automation and fan boxes",
        itemsCount: 8,
        totalValue: 125000,
        items: [
          {
            id: "itm-cove-light",
            name: "Warm White LED Strip & Profile",
            code: "ELE-LED-001",
            type: "Fixture",
            unit: "R.ft",
            quantity: 60,
            baseCost: 180,
            sellingRate: 240,
            rate: 240,
            wastePercent: 5,
            taxPercent: 18,
            amount: 16992,
            rateStatus: "MAPPED",
            description: "24V 3000K warm white with aluminum diffuser profile",
          },
          {
            id: "itm-switch-plate",
            name: "Smart Modular Touch Switch Plate",
            code: "ELE-SWT-002",
            type: "Automation",
            unit: "Nos",
            quantity: 6,
            baseCost: 2400,
            sellingRate: 3200,
            rate: 3200,
            wastePercent: 0,
            taxPercent: 18,
            amount: 22656,
            rateStatus: "MAPPED",
            description: "6-gang touch plate compatible with Zigbee hub",
          },
        ],
      },
    ],
  },
  {
    id: "area-living-room",
    name: "Living Room",
    type: "Common Area",
    dimensions: "24ft x 18ft",
    code: "LIV-01",
    description: "Main reception living room with double height paneling and balcony entryway.",
    includedByDefault: true,
    allowRename: true,
    requiredArea: true,
    sections: [
      {
        id: "sec-tv-unit",
        name: "TV Unit & Paneling",
        code: "SEC-PAN-01",
        description: "Fluted charcoal paneling with stone veneer ledge",
        itemsCount: 6,
        totalValue: 185000,
        items: [
          {
            id: "itm-fluted-panel",
            name: "Fluted Charcoal Louvers",
            code: "PAN-FLT-001",
            type: "Paneling",
            unit: "Sq.ft",
            quantity: 90,
            baseCost: 850,
            sellingRate: 1150,
            rate: 1150,
            wastePercent: 8,
            taxPercent: 18,
            amount: 122130,
            rateStatus: "MAPPED",
            description: "Charcoal WPC louvers 12mm thickness",
          },
          {
            id: "itm-stone-console",
            name: "Floating Quartz TV Console",
            code: "FUR-CNS-002",
            type: "Furniture",
            unit: "R.ft",
            quantity: 10,
            baseCost: 4500,
            sellingRate: 6200,
            rate: 6200,
            wastePercent: 0,
            taxPercent: 18,
            amount: 73160,
            rateStatus: "MAPPED",
            description: "Calacatta gold composite quartz with push-to-open soft closing drawers",
          },
        ],
      },
      {
        id: "sec-painting-living",
        name: "Painting & Polish",
        code: "SEC-PNT-01",
        description: "Premium emulsion paint with PU clear coat over wooden rafters",
        itemsCount: 4,
        totalValue: 95000,
        items: [
          {
            id: "itm-emulsion",
            name: "Royale Luxury Emulsion Paint",
            code: "PNT-ROY-001",
            type: "Finish",
            unit: "Sq.ft",
            quantity: 650,
            baseCost: 65,
            sellingRate: 88,
            rate: 88,
            wastePercent: 5,
            taxPercent: 18,
            amount: 67496,
            rateStatus: "MAPPED",
            description: "3 coats over acrylic primer with fine sanding",
          },
          {
            id: "itm-pu-polish",
            name: "Matt PU Polish for Ceiling Rafters",
            code: "PNT-POL-002",
            type: "Polish",
            unit: "Sq.ft",
            quantity: 120,
            baseCost: 160,
            sellingRate: 220,
            rate: 220,
            wastePercent: 5,
            taxPercent: 18,
            amount: 31152,
            rateStatus: "MAPPED",
            description: "Polyurethane clear satin matte coating",
          },
        ],
      },
    ],
  },
];

// ── 3. Two Mock BOQ Sections ────────────────────────────────────────

export const mockBoqSections: MockSection[] = [
  {
    id: "sec-fur-full",
    name: "Furniture",
    code: "SEC-FUR-01",
    description: "Master Bedroom · BOQ Section",
    itemsCount: 11,
    totalValue: 482000,
    items: [
      {
        id: "itm-1",
        name: "Full Height Wardrobe",
        code: "MAT-BRD-001",
        type: "Material",
        unit: "Sq.ft",
        quantity: 72,
        baseCost: 2200,
        sellingRate: 2875,
        rate: 2875,
        wastePercent: 5,
        taxPercent: 18,
        amount: 227736,
        rateStatus: "MAPPED",
        description: "19mm BWP ply, laminate finish",
      },
      {
        id: "itm-2",
        name: "King Size Bed",
        code: "MAT-BRD-002",
        type: "Material",
        unit: "Nos",
        quantity: 1,
        baseCost: 38000,
        sellingRate: 45800,
        rate: 45800,
        wastePercent: 0,
        taxPercent: 18,
        amount: 54044,
        rateStatus: "MAPPED",
        description: "Upholstered headboard",
      },
    ],
  },
  {
    id: "sec-pnt-full",
    name: "Painting",
    code: "SEC-PNT-01",
    description: "Living Room · BOQ Section",
    itemsCount: 6,
    totalValue: 120000,
    items: [
      {
        id: "itm-3",
        name: "Royale Emulsion Wall Finish",
        code: "MAT-PNT-001",
        type: "Finish",
        unit: "Sq.ft",
        quantity: 800,
        baseCost: 60,
        sellingRate: 85,
        rate: 85,
        wastePercent: 5,
        taxPercent: 18,
        amount: 80240,
        rateStatus: "MAPPED",
        description: "Teflon surface protector smooth sheen",
      },
      {
        id: "itm-4",
        name: "Texture Feature Wall",
        code: "MAT-PNT-002",
        type: "Special Finish",
        unit: "Sq.ft",
        quantity: 150,
        baseCost: 190,
        sellingRate: 260,
        rate: 260,
        wastePercent: 5,
        taxPercent: 18,
        amount: 45960,
        rateStatus: "MAPPED",
        description: "Lime plaster concrete stucco effect",
      },
    ],
  },
];

// ── 4. Two Mock BOQ Items ───────────────────────────────────────────

export const mockBoqItems: MockItem[] = [
  {
    id: "itm-sample-1",
    name: "Full Height Wardrobe",
    code: "MAT-BRD-001",
    type: "Material",
    unit: "Sq.ft",
    quantity: 72,
    baseCost: 2200,
    sellingRate: 2875,
    rate: 2875,
    wastePercent: 5,
    taxPercent: 18,
    amount: 227736,
    rateStatus: "MAPPED",
    description: "19mm BWP ply, laminate finish",
  },
  {
    id: "itm-sample-2",
    name: "King Size Bed",
    code: "MAT-BRD-002",
    type: "Material",
    unit: "Nos",
    quantity: 1,
    baseCost: 38000,
    sellingRate: 45800,
    rate: 45800,
    wastePercent: 0,
    taxPercent: 18,
    amount: 54044,
    rateStatus: "MAPPED",
    description: "Upholstered headboard",
  },
];

// ── 5. Two Mock Workflow Stages ─────────────────────────────────────

export const mockWorkflowStages: MockWorkflowStage[] = [
  {
    id: "stg-discovery",
    name: "Discovery",
    code: "STG-001",
    description: "Client briefing, site measurements and budget alignment",
    status: "COMPLETED",
    owner: "Project Manager",
    duration: 5,
    durationUnit: "Business Days",
    entryCondition: "Contract Executed & Deposit Paid",
    exitCondition: "Discovery Sign Off Completed",
    tasksCount: 4,
    milestonesCount: 1,
    approvalsCount: 1,
    tasks: [
      {
        id: "tsk-disc-1",
        name: "Site Laser Measurement",
        assignee: "Site Supervisor",
        duration: "2 Days",
        dependency: "Project Kickoff",
        approval: "No",
      },
      {
        id: "tsk-disc-2",
        name: "Client Requirement Briefing",
        assignee: "Lead Designer",
        duration: "3 Days",
        dependency: "Site Laser Measurement",
        approval: "Yes",
      },
    ],
  },
  {
    id: "stg-design",
    name: "Design",
    code: "STG-002",
    description: "Create review and finalise the interior 2D/3D design package",
    status: "ACTIVE",
    owner: "Design Manager",
    duration: 12,
    durationUnit: "Business Days",
    entryCondition: "Discovery Sign Off Completed",
    exitCondition: "Design Approval Received",
    tasksCount: 6,
    milestonesCount: 3,
    approvalsCount: 3,
    tasks: [
      {
        id: "tsk-des-1",
        name: "Concept Design",
        assignee: "Lead Designer",
        duration: "3 Days",
        dependency: "Project Kickoff",
        approval: "No",
      },
      {
        id: "tsk-des-2",
        name: "Client Review",
        assignee: "Project Manager",
        duration: "2 Days",
        dependency: "Concept Design",
        approval: "Yes",
      },
    ],
  },
];

// ── 6. Two Mock Workflow Tasks ──────────────────────────────────────

// ── 6. Mock Workflow Tasks ──────────────────────────────────────────

export const mockWorkflowTasks: MockWorkflowTask[] = [
  {
    id: "tsk-1",
    name: "Client Briefing & Requirement",
    stage: "01 Initiation",
    assignee: "Project Manager",
    assigneeRole: "Project Manager",
    duration: "1 Days",
    dependency: "01",
    criticality: "MEDIUM",
    status: "ACTIVE",
    approval: "No",
    order: 1,
  },
  {
    id: "tsk-2",
    name: "Site Visit & Measurement",
    stage: "01 Initiation",
    assignee: "Site Engineer",
    assigneeRole: "Site Engineer",
    duration: "2 Days",
    dependency: "01",
    criticality: "MEDIUM",
    status: "ACTIVE",
    approval: "No",
    order: 2,
  },
  {
    id: "tsk-3",
    name: "Concept Development",
    stage: "02 Design",
    assignee: "Designer",
    assigneeRole: "Lead Designer",
    duration: "5 Days",
    dependency: "01",
    criticality: "HIGH",
    status: "ACTIVE",
    approval: "No",
    order: 3,
  },
  {
    id: "tsk-4",
    name: "Client Review Concept",
    stage: "02 Design",
    assignee: "Project Manager",
    assigneeRole: "Project Manager",
    duration: "2 Days",
    dependency: "01",
    criticality: "HIGH",
    status: "ACTIVE",
    approval: "Yes",
    order: 4,
  },
  {
    id: "tsk-5",
    name: "Design Approval",
    stage: "02 Design",
    assignee: "Client",
    assigneeRole: "Client",
    duration: "1 Days",
    dependency: "01",
    criticality: "CRITICAL",
    status: "ACTIVE",
    approval: "Yes",
    order: 5,
  },
  {
    id: "tsk-6",
    name: "3D Visualisation & Renderings",
    stage: "02 Design",
    assignee: "Designer",
    assigneeRole: "3D Visualizer",
    duration: "4 Days",
    dependency: "02",
    criticality: "HIGH",
    status: "ACTIVE",
    approval: "No",
    order: 6,
  },
  {
    id: "tsk-7",
    name: "BOQ Quantity Estimation",
    stage: "03 Costing",
    assignee: "Project Manager",
    assigneeRole: "Senior Estimator",
    duration: "3 Days",
    dependency: "02",
    criticality: "MEDIUM",
    status: "ACTIVE",
    approval: "No",
    order: 7,
  },
  {
    id: "tsk-8",
    name: "Contractor Rate Sourcing",
    stage: "03 Costing",
    assignee: "Site Engineer",
    assigneeRole: "Procurement Lead",
    duration: "2 Days",
    dependency: "03",
    criticality: "MEDIUM",
    status: "ACTIVE",
    approval: "No",
    order: 8,
  },
];

// ── 6b. Mock Milestones ─────────────────────────────────────────────

export const mockMilestones: MockMilestone[] = [
  {
    id: "ms-1",
    code: "MS-001",
    orderNumber: "01",
    name: "Project Kickoff",
    subtitle: "Project initiation, client onboarding and overall alignment",
    description: "Align core design priorities, budget envelopes and client point of contact.",
    category: "Management",
    ownerRole: "Project Manager",
    duration: "2 Days",
    durationDays: 2,
    tasksCount: 6,
    deliverablesCount: 2,
    approvalType: "No Approval",
    status: "CONFIGURED",
    startRule: "Project Creation",
    completionRule: "All Required Tasks Complete",
    linkedTasks: 6,
    linkedDeliverables: 2,
    linkedApprovals: "NA",
    linkedDependencies: 0,
    nextMilestoneTitle: "Site Measurement (MS-002)",
    nextMilestoneCode: "MS-002",
  },
  {
    id: "ms-2",
    code: "MS-002",
    orderNumber: "02",
    name: "Site Measurement",
    subtitle: "Site visit, measurement and site data collection",
    description: "Physical inspection with laser scanners and column/beam structural notation.",
    category: "Engineering",
    ownerRole: "Site Engineer",
    duration: "2 Days",
    durationDays: 2,
    tasksCount: 5,
    deliverablesCount: 1,
    approvalType: "No Approval",
    status: "CONFIGURED",
    startRule: "After Project Kickoff",
    completionRule: "Site Scan Data Uploaded",
    linkedTasks: 5,
    linkedDeliverables: 1,
    linkedApprovals: "NA",
    linkedDependencies: 1,
    nextMilestoneTitle: "Concept Design (MS-003)",
    nextMilestoneCode: "MS-003",
  },
  {
    id: "ms-3",
    code: "MS-003",
    orderNumber: "03",
    name: "Concept Design",
    subtitle: "Concept development and design direction",
    description: "Moodboards, space layouts, and architectural style direction.",
    category: "Designer",
    ownerRole: "Lead Designer",
    duration: "7 Business Days",
    durationDays: 7,
    tasksCount: 6,
    deliverablesCount: 2,
    approvalType: "No Approval",
    status: "CONFIGURED",
    startRule: "After Site Measurement",
    completionRule: "All Required Tasks Complete",
    linkedTasks: 8,
    linkedDeliverables: 3,
    linkedApprovals: "NA",
    linkedDependencies: 1,
    nextMilestoneTitle: "3D Design Approval (MS-004)",
    nextMilestoneCode: "MS-004",
  },
  {
    id: "ms-4",
    code: "MS-004",
    orderNumber: "04",
    name: "3D Design Approval",
    subtitle: "3D presentation and client approval",
    description: "Photorealistic CGI renders of living room, kitchen, and master suite.",
    category: "Design",
    ownerRole: "3D Lead",
    duration: "3 Days",
    durationDays: 3,
    tasksCount: 6,
    deliverablesCount: 2,
    approvalType: "Client Approval",
    status: "CONFIGURED",
    startRule: "After Concept Design",
    completionRule: "Client Signature Received",
    linkedTasks: 6,
    linkedDeliverables: 2,
    linkedApprovals: "APR-TPL-001",
    linkedDependencies: 1,
    nextMilestoneTitle: "BOQ Finalisation (MS-005)",
    nextMilestoneCode: "MS-005",
  },
  {
    id: "ms-5",
    code: "MS-005",
    orderNumber: "05",
    name: "BOQ Finalisation",
    subtitle: "Prepare and finalise BOQ with Costing",
    description: "Itemized costing rates, markup margins, and vendor quotes compilation.",
    category: "Costing",
    ownerRole: "Senior Estimator",
    duration: "4 Days",
    durationDays: 4,
    tasksCount: 6,
    deliverablesCount: 7,
    approvalType: "Finance Approval",
    status: "CONFIGURED",
    startRule: "After 3D Design Approval",
    completionRule: "BOQ Rates Validated",
    linkedTasks: 6,
    linkedDeliverables: 7,
    linkedApprovals: "APR-TPL-002",
    linkedDependencies: 1,
    nextMilestoneTitle: "Client Approval (MS-006)",
    nextMilestoneCode: "MS-006",
  },
  {
    id: "ms-6",
    code: "MS-006",
    orderNumber: "06",
    name: "Client Approval",
    subtitle: "Final proposal submission and client sign-off",
    description: "Contract and commercial terms acceptance with booking advance.",
    category: "Commercial",
    ownerRole: "Account Lead",
    duration: "2 Days",
    durationDays: 2,
    tasksCount: 5,
    deliverablesCount: 1,
    approvalType: "Client Approval",
    status: "CONFIGURED",
    startRule: "After BOQ Finalisation",
    completionRule: "Client Signoff Form Uploaded",
    linkedTasks: 5,
    linkedDeliverables: 1,
    linkedApprovals: "APR-TPL-004",
    linkedDependencies: 1,
    nextMilestoneTitle: "Execution Start (MS-007)",
    nextMilestoneCode: "MS-007",
  },
  {
    id: "ms-7",
    code: "MS-007",
    orderNumber: "07",
    name: "Execution Start",
    subtitle: "Project mobilisation and execution kickoff.",
    description: "Material procurement, contractor site mobilization, and demolition.",
    category: "Execution",
    ownerRole: "Site Supervisor",
    duration: "1 Days",
    durationDays: 1,
    tasksCount: 5,
    deliverablesCount: 1,
    approvalType: "No Approval",
    status: "CONFIGURED",
    startRule: "After Advance Payment",
    completionRule: "Site Handover Protocol Done",
    linkedTasks: 5,
    linkedDeliverables: 1,
    linkedApprovals: "NA",
    linkedDependencies: 1,
    nextMilestoneTitle: "Project Handover (MS-008)",
    nextMilestoneCode: "MS-008",
  },
  {
    id: "ms-8",
    code: "MS-008",
    orderNumber: "08",
    name: "Project Handover",
    subtitle: "Final inspection, handover and closure.",
    description: "Deep clean, client snag rectification walkthrough, and key transfer.",
    category: "Operations",
    ownerRole: "Project Manager",
    duration: "2 Days",
    durationDays: 2,
    tasksCount: 5,
    deliverablesCount: 2,
    approvalType: "Client Approval",
    status: "CONFIGURED",
    startRule: "After Quality Audit",
    completionRule: "Client Satisfaction Certificate",
    linkedTasks: 5,
    linkedDeliverables: 2,
    linkedApprovals: "APR-TPL-006",
    linkedDependencies: 1,
    nextMilestoneTitle: "Project Closed",
    nextMilestoneCode: "END",
  },
];

// ── 6c. Mock Approval Flows ─────────────────────────────────────────

export const mockApprovalFlows: MockApprovalFlow[] = [
  {
    id: "apr-1",
    code: "APR-TPL-001",
    name: "Design Concept Approval",
    category: "Design",
    version: "v2.1",
    description:
      "Approval required before design process can proceed from concept to execution planning.",
    triggerTitle: "Milestone Reached",
    triggerDescription: "Design Concept Complete",
    stagesCount: 2,
    mode: "Sequential",
    sla: "2 Business Days",
    status: "ACTIVE",
    createdBy: "Admin User",
    createdAt: "04 Aug 2026",
    lastUpdated: "12 Aug 2026",
    lastUpdatedBy: "Admin",
    approvers: [
      { label: "PM", role: "Project Manager", color: "red" },
      { label: "LD", role: "Lead Designer", color: "green" },
      { label: "CL", role: "Client", color: "blue" },
    ],
    previewSteps: [
      {
        header: "TRIGGER",
        title: "Milestone Reached",
        subtitle: "Design Concept Completed",
      },
      {
        badge: "01",
        title: "Project Manager",
        subtitle: "All Required",
      },
      {
        badge: "02",
        title: "Client",
        subtitle: "Required",
      },
      {
        header: "Approved",
        title: "on Approval",
        subtitle: "Update Milestone, Notify Parties",
      },
    ],
  },
  {
    id: "apr-2",
    code: "APR-TPL-002",
    name: "BOQ Approval",
    category: "Costing",
    version: "v1.4",
    description:
      "Verification of itemized rate sheets and margin approval prior to client proposal release.",
    triggerTitle: "BOQ Submitted",
    triggerDescription: "BOQ Finalised",
    stagesCount: 2,
    mode: "Sequential",
    sla: "1 Business Day",
    status: "ACTIVE",
    createdBy: "Admin User",
    createdAt: "02 Aug 2026",
    lastUpdated: "10 Aug 2026",
    lastUpdatedBy: "Admin",
    approvers: [
      { label: "PM", role: "Project Manager", color: "red" },
      { label: "CL", role: "Client", color: "blue" },
    ],
    previewSteps: [
      {
        header: "TRIGGER",
        title: "BOQ Submitted",
        subtitle: "BOQ Finalised",
      },
      {
        badge: "01",
        title: "Project Manager",
        subtitle: "All Required",
      },
      {
        badge: "02",
        title: "Finance Lead",
        subtitle: "Required",
      },
      {
        header: "Approved",
        title: "on Approval",
        subtitle: "Notify Estimator and Client",
      },
    ],
  },
  {
    id: "apr-3",
    code: "APR-TPL-003",
    name: "Material Approval",
    category: "Procurement",
    version: "v1.1",
    description:
      "Client approval on physical finishes, laminates, and veneer swatches prior to order.",
    triggerTitle: "Material Selected",
    triggerDescription: "Material Finalised",
    stagesCount: 1,
    mode: "Sequential",
    sla: "2 Business Days",
    status: "ACTIVE",
    createdBy: "Admin User",
    createdAt: "28 Jul 2026",
    lastUpdated: "06 Aug 2026",
    lastUpdatedBy: "Admin",
    approvers: [{ label: "CL", role: "Client", color: "blue" }],
    previewSteps: [
      {
        header: "TRIGGER",
        title: "Material Selected",
        subtitle: "Material Finalised",
      },
      {
        badge: "01",
        title: "Client",
        subtitle: "Direct Signoff",
      },
      {
        header: "Approved",
        title: "on Approval",
        subtitle: "Confirm PO with Procurement",
      },
    ],
  },
  {
    id: "apr-4",
    code: "APR-TPL-004",
    name: "Final Design Approval",
    category: "Design",
    version: "v1.0",
    description:
      "Complete interior design package signoff before procurement issuance.",
    triggerTitle: "Milestone Reached",
    triggerDescription: "Design Completed",
    stagesCount: 2,
    mode: "Sequential",
    sla: "2 Business Days",
    status: "DRAFT",
    createdBy: "Admin User",
    createdAt: "25 Jul 2026",
    lastUpdated: "02 Aug 2026",
    lastUpdatedBy: "Admin",
    approvers: [
      { label: "LD", role: "Lead Designer", color: "green" },
      { label: "CL", role: "Client", color: "blue" },
    ],
    previewSteps: [
      {
        header: "TRIGGER",
        title: "Milestone Reached",
        subtitle: "Design Completed",
      },
      {
        badge: "01",
        title: "Lead Designer",
        subtitle: "Technical Signoff",
      },
      {
        badge: "02",
        title: "Client",
        subtitle: "Final Approval",
      },
      {
        header: "Approved",
        title: "on Approval",
        subtitle: "Transition to Costing Stage",
      },
    ],
  },
  {
    id: "apr-5",
    code: "APR-TPL-005",
    name: "Budget Approval",
    category: "Commercial",
    version: "v1.2",
    description:
      "Director signoff required when project estimate exceeds budget ceiling threshold.",
    triggerTitle: "Amount Changed",
    triggerDescription: "Budget > ₹10,00,000",
    stagesCount: 2,
    mode: "Sequential",
    sla: "1 Business Day",
    status: "DRAFT",
    createdBy: "Admin User",
    createdAt: "20 Jul 2026",
    lastUpdated: "01 Aug 2026",
    lastUpdatedBy: "Admin",
    approvers: [{ label: "PM", role: "Project Manager", color: "red" }],
    previewSteps: [
      {
        header: "TRIGGER",
        title: "Amount Changed",
        subtitle: "Budget > ₹10,00,000",
      },
      {
        badge: "01",
        title: "Project Manager",
        subtitle: "Verification",
      },
      {
        badge: "02",
        title: "Finance Director",
        subtitle: "Executive Clearance",
      },
      {
        header: "Approved",
        title: "on Approval",
        subtitle: "Authorize BOQ Release",
      },
    ],
  },
  {
    id: "apr-6",
    code: "APR-TPL-006",
    name: "Change Request Approval",
    category: "Execution",
    version: "v1.0",
    description:
      "Scope modification governance during on-site execution to prevent budget drift.",
    triggerTitle: "Manual Request",
    triggerDescription: "Change Request Created",
    stagesCount: 2,
    mode: "Sequential",
    sla: "2 Business Days",
    status: "DRAFT",
    createdBy: "Admin User",
    createdAt: "18 Jul 2026",
    lastUpdated: "01 Aug 2026",
    lastUpdatedBy: "Admin",
    approvers: [
      { label: "PM", role: "Project Manager", color: "red" },
      { label: "LD", role: "Lead Designer", color: "green" },
      { label: "CL", role: "Client", color: "blue" },
    ],
    previewSteps: [
      {
        header: "TRIGGER",
        title: "Manual Request",
        subtitle: "Change Request Created",
      },
      {
        badge: "01",
        title: "Lead Designer",
        subtitle: "Impact Assessment",
      },
      {
        badge: "02",
        title: "Client",
        subtitle: "Commercial Acceptance",
      },
      {
        header: "Approved",
        title: "on Approval",
        subtitle: "Generate Addendum Invoice",
      },
    ],
  },
];

// ── 6d. Mock Workflow Rules ─────────────────────────────────────────

export const mockWorkflowRules: MockWorkflowRule[] = [
  {
    id: "rul-1",
    code: "RUL-001",
    name: "Budget Escalation Notice",
    trigger: "Cost Variance > 5%",
    condition: "Estimated Total > Approved BOQ",
    action: "Notify PM & Freeze BOQ Edits",
    stage: "Costing",
    status: "ACTIVE",
    lastModified: "12 Aug 2026",
  },
  {
    id: "rul-2",
    code: "RUL-002",
    name: "Milestone Sign-off Verification",
    trigger: "Deliverable Uploaded",
    condition: "All Inspection Photos Validated",
    action: "Require Digital Client Sign-off",
    stage: "Approval",
    status: "ACTIVE",
    lastModified: "10 Aug 2026",
  },
  {
    id: "rul-3",
    code: "RUL-003",
    name: "Snag Auto-Clearance",
    trigger: "Punchlist Verification",
    condition: "Supervisor Photo Uploaded",
    action: "Notify Quality Auditor",
    stage: "Handover",
    status: "ACTIVE",
    lastModified: "04 Aug 2026",
  },
  {
    id: "rul-4",
    code: "RUL-004",
    name: "Advance Payment Gate",
    trigger: "Advance Cleared",
    condition: "Payment Ref Recorded",
    action: "Unlock Mobilisation Phase",
    stage: "Execution",
    status: "ACTIVE",
    lastModified: "01 Aug 2026",
  },
];

// ── 7. Two Mock Documents ───────────────────────────────────────────

export const mockDocuments: MockDocument[] = [
  {
    id: "doc-1",
    name: "Client Sign-off Form",
    type: "Client Agreement",
    status: "ACTIVE",
    version: "v1.2",
    updatedAt: "2026-08-06T10:30:00Z",
    format: "PDF",
  },
  {
    id: "doc-2",
    name: "Interior Material Specifications",
    type: "Specification Sheet",
    status: "ACTIVE",
    version: "v2.0",
    updatedAt: "2026-08-10T14:15:00Z",
    format: "DOCX",
  },
];

// ── 8. Two Mock Versions ────────────────────────────────────────────

export const mockVersions: MockVersion[] = [
  {
    id: "ver-1",
    version: "v3.2",
    status: "ACTIVE",
    publishedAt: "2026-08-06T10:30:00Z",
    publishedBy: "Pradhyumn D",
    changeNote: "Updated modular wardrobe specifications and rate tables for 2026 Q3.",
    createdAt: "2026-08-06T10:30:00Z",
  },
  {
    id: "ver-2",
    version: "v3.1",
    status: "ARCHIVED",
    publishedAt: "2026-07-15T09:00:00Z",
    publishedBy: "Sarah Jenkins",
    changeNote: "Initial revised electrical schematic definitions.",
    createdAt: "2026-07-15T09:00:00Z",
  },
];

// ── 9. Two Mock Usage Records ───────────────────────────────────────

export const mockUsageRecords: MockUsageRecord[] = [
  {
    id: "usg-1",
    projectName: "Skyline Residences - Unit 14B",
    clientName: "Vikram Malhotra",
    location: "Mumbai, Bandra",
    usedAt: "2026-08-18T11:20:00Z",
    status: "In Progress",
  },
  {
    id: "usg-2",
    projectName: "Green Valley Penthouse",
    clientName: "Anita Sharma",
    location: "Bengaluru, Whitefield",
    usedAt: "2026-08-12T16:45:00Z",
    status: "Completed",
  },
];

// ── 10. Two Mock Activity Records ───────────────────────────────────

export const mockActivityRecords: MockActivityRecord[] = [
  {
    id: "act-1",
    action: "Version Published",
    description: "Published template version v3.2 with updated costing rules.",
    actor: "Pradhyumn D",
    timestamp: "2026-08-06T10:30:00Z",
  },
  {
    id: "act-2",
    action: "Section Modified",
    description: "Updated BOQ section 'Furniture' rates in Master Bedroom.",
    actor: "Lead Designer",
    timestamp: "2026-08-05T15:20:00Z",
  },
];
