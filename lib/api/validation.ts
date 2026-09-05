
import { z } from "zod";

const email = z
  .string()
  .trim()
  .email()
  .transform((value) => value.toLowerCase());

const password = z.string().min(10).max(128);

export const registerSchema = z
  .object({
    email,
    password,
    displayName: z.string().trim().min(1).max(120).optional(),
    companyName: z.string().trim().min(1).max(160).optional(),
  })
  .strict();

export const loginSchema = z.union([
  z.object({ email }).strict(),

  z
    .object({
      email,
      otp: z
        .string()
        .trim()
        .regex(/^\d{6}$/, "OTP must be a 6-digit code."),
    })
    .strict(),

  z
    .object({
      email,
      password: z.string().min(1).max(128),
    })
    .strict(),
]);

export const forgotPasswordSchema = z
  .object({
    email,
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    code: z.string().min(1),
    password,
  })
  .strict();

export const verifyEmailSchema = z
  .object({
    tokenHash: z.string().min(1),
    type: z.enum(["email", "signup", "email_change"]),
  })
  .strict();

export const verifyEmailOtpSchema = z
  .object({
    email,
    otp: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "OTP must be a 6-digit code."),
  })
  .strict();

export const resendVerificationSchema = z
  .object({
    email,
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: password,
  })
  .strict();

export const userPatchSchema = z
  .object({
    displayName: z.string().trim().min(1).max(120).nullable().optional(),
  })
  .strict();

export const preferencesPatchSchema = z
  .object({
    timezone: z.string().trim().min(1).max(80).optional(),
    locale: z.string().trim().min(2).max(20).optional(),
  })
  .strict();

export const onboardingPatchSchema = z
  .object({
    currentStep: z.string().trim().min(1).max(80).optional(),

    completedSteps: z
      .array(z.string().trim().min(1).max(80))
      .max(50)
      .optional(),

    skippedSteps: z
      .array(z.string().trim().min(1).max(80))
      .max(50)
      .optional(),

    company: z
      .object({
        name: z.string().trim().min(1).max(160).optional(),
        logoUrl: z.string().url().max(2048).nullable().optional(),
        website: z.string().url().max(2048).nullable().optional(),
        businessEmail: z.string().email().nullable().optional(),
        phone: z.string().trim().max(40).nullable().optional(),
        address: z.string().trim().max(500).nullable().optional(),
        country: z.string().trim().max(80).nullable().optional(),
        currency: z
          .string()
          .trim()
          .regex(/^[A-Z]{3}$/)
          .optional(),
        taxId: z.string().trim().max(80).nullable().optional(),
        timezone: z.string().trim().min(1).max(80).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

const projectBaseSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    clientName: z.string().trim().min(1).max(160),
    projectType: z.string().trim().min(1).max(80),
    status: z.enum(["active", "planning", "in_progress", "on_hold", "completed"]).optional(),
    location: z.string().trim().max(240).optional(),
    clientContact: z.string().trim().max(40).nullable().optional(),
    clientEmail: z.string().trim().email().max(254).nullable().optional(),
    description: z.string().trim().max(5000).nullable().optional(),
    areaSqft: z.coerce.number().finite().positive().max(100_000_000).nullable().optional(),
    projectValue: z.coerce.number().finite().min(0).max(999_999_999_999_999).nullable().optional(),
    approvedBudget: z.coerce.number().finite().min(0).max(999_999_999_999_999).nullable().optional(),
    startDate: z.string().date().nullable().optional(),
    targetCompletionDate: z.string().date().nullable().optional(),
    assignedDesignerId: z.string().uuid().nullable().optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  })
  .strict();

export const projectCreateSchema = projectBaseSchema.extend({
  status: z.enum(["active", "planning", "in_progress", "on_hold", "completed"]).default("planning"),
}).superRefine((value, ctx) => {
    if (value.startDate && value.targetCompletionDate && value.targetCompletionDate < value.startDate) {
      ctx.addIssue({ code: "custom", path: ["targetCompletionDate"], message: "Target completion cannot be before the start date." });
    }
  });

export const projectPatchSchema = projectBaseSchema.partial().strict().superRefine((value, ctx) => {
  if (Object.keys(value).length === 0) ctx.addIssue({ code: "custom", path: [], message: "At least one field is required." });
  if (value.startDate && value.targetCompletionDate && value.targetCompletionDate < value.startDate) {
    ctx.addIssue({ code: "custom", path: ["targetCompletionDate"], message: "Target completion cannot be before the start date." });
  }
});

export const projectStatusSchema = z.object({
  status: z.enum(["active", "planning", "in_progress", "on_hold", "completed"]),
}).strict();

export const projectRoomCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  roomType: z.string().trim().min(1).max(80),
  length: z.coerce.number().finite().positive().max(100_000).nullable().optional(),
  width: z.coerce.number().finite().positive().max(100_000).nullable().optional(),
  height: z.coerce.number().finite().positive().max(100_000).nullable().optional(),
  unit: z.enum(["ft", "m"]).default("ft"),
  notes: z.string().trim().max(2000).nullable().optional(),
}).strict();

export const projectRoomPatchSchema = projectRoomCreateSchema.partial().strict().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field is required.",
);

const money = z.coerce.number().finite().min(0).max(999_999_999_999_999);
const percent = z.coerce.number().finite().min(0).max(100);

export const boqCreateSchema = z.object({
  boqNumber: z.string().trim().min(1).max(80),
  projectId: z.string().uuid(),
  version: z.string().trim().min(1).max(40).default("v1"),
  assignedTo: z.string().uuid().nullable().optional(),
  method: z.enum(["blank", "template"]).default("blank"),
  templateId: z.string().uuid().nullable().optional(),
  markupPercent: percent.default(0),
  taxPercent: percent.default(18),
}).strict().superRefine((value, ctx) => {
  if (value.method === "template" && !value.templateId) ctx.addIssue({ code: "custom", path: ["templateId"], message: "templateId is required when method is template." });
});

export const boqPatchSchema = z.object({
  version: z.string().trim().min(1).max(40).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  markupPercent: percent.optional(), taxPercent: percent.optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "At least one field is required.");

export const boqStatusSchema = z.object({ status: z.enum(["draft", "in_review", "approved", "archived"]) }).strict();
export const boqRoomSchema = z.object({ name: z.string().trim().min(1).max(120), description: z.string().trim().max(1000).nullable().optional() }).strict();
export const boqCategorySchema = z.object({ name: z.string().trim().min(1).max(120), description: z.string().trim().max(1000).nullable().optional() }).strict();
export const boqItemSchema = z.object({
  name: z.string().trim().min(1).max(200), description: z.string().trim().max(2000).nullable().optional(),
  unit: z.string().trim().min(1).max(40), quantity: z.coerce.number().finite().positive().max(999_999_999),
  rate: money, wastePercent: percent.default(0), taxPercent: percent.default(18), sortOrder: z.number().int().min(0).optional(),
}).strict();
export const boqTemplateSchema = z.object({
  name: z.string().trim().min(1).max(160), boqId: z.string().uuid(),
  description: z.string().trim().max(2000).nullable().optional(), tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
}).strict();

const templateVisibility = z.literal("workspace");
const templateJson = z.record(z.string(), z.unknown());

export const projectTemplateCreateSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(5000).nullable().optional(),
  businessType: z.string().trim().min(1).max(80),
  projectType: z.string().trim().min(1).max(80),
  team: z.string().trim().max(120).nullable().optional(),
  region: z.string().trim().max(120).nullable().optional(),
  visibility: templateVisibility.default("workspace"),
  imageUrl: z.string().url().max(2048).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  structure: templateJson.default({}),
  costingBoq: templateJson.default({}),
  workflow: templateJson.default({}),
  documents: z.array(templateJson).max(500).default([]),
}).strict();

export const projectTemplatePatchSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  businessType: z.string().trim().min(1).max(80).optional(),
  projectType: z.string().trim().min(1).max(80).optional(),
  team: z.string().trim().max(120).nullable().optional(),
  region: z.string().trim().max(120).nullable().optional(),
  visibility: templateVisibility.optional(),
  imageUrl: z.string().url().max(2048).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  status: z.enum(["draft", "needs_review"]).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "At least one field is required.");

export const projectTemplateSectionSchema = z.object({ data: templateJson }).strict();

export const projectTemplateDocumentsSchema = z.object({
  documents: z.array(templateJson).max(500),
}).strict();

export const projectTemplateUseSchema = z.object({
  projectName: z.string().trim().min(1).max(160),
  clientName: z.string().trim().min(1).max(160),
  location: z.string().trim().max(240).nullable().optional(),
  startDate: z.string().date().nullable().optional(),
  targetCompletionDate: z.string().date().nullable().optional(),
}).strict().superRefine((value, ctx) => {
  if (value.startDate && value.targetCompletionDate && value.targetCompletionDate < value.startDate) {
    ctx.addIssue({ code: "custom", path: ["targetCompletionDate"], message: "Target completion cannot be before the start date." });
  }
});

export const projectTemplatePublishSchema = z.object({
  changeNote: z.string().trim().max(500).nullable().optional(),
}).strict();

export const settingsSectionSchema = z.object({ data: z.record(z.string(), z.unknown()) }).strict();
export const billingContactSchema = z.object({ email: z.string().trim().email().max(254) }).strict();
export const paymentMethodSchema = z.object({
  brand: z.string().trim().min(1).max(40), last4: z.string().regex(/^\d{4}$/),
  expiryMonth: z.number().int().min(1).max(12).optional(), expiryYear: z.number().int().min(2020).max(2200).optional(),
}).strict();
export const subscriptionChangeSchema = z.object({ planCode: z.enum(["starter", "professional", "business", "enterprise"]), billingFrequency: z.enum(["monthly", "annual"]).default("monthly") }).strict();

export const activityStageSchema = z.object({ name: z.string().trim().min(1).max(120), color: z.string().trim().max(40).nullable().optional(), terminalType: z.enum(["completed", "lost"]).nullable().optional() }).strict();
export const activityTaskSchema = z.object({
  name: z.string().trim().min(1).max(200), projectId: z.string().uuid(), stageId: z.string().uuid(),
  description: z.string().trim().max(5000).nullable().optional(), assignedTo: z.string().uuid().nullable().optional(), ownerId: z.string().uuid().nullable().optional(),
  dueDate: z.string().date().nullable().optional(), priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  status: z.enum(["not_started", "in_progress", "blocked", "completed", "cancelled"]).default("not_started"),
  attachments: z.array(z.record(z.string(), z.unknown())).max(20).default([]),
}).strict();
export const activityTaskPatchSchema = activityTaskSchema.omit({ projectId: true }).partial().strict().refine((value) => Object.keys(value).length > 0, "At least one field is required.");
export const activityApprovalSchema = z.object({
  name: z.string().trim().min(1).max(200), projectId: z.string().uuid(), stageId: z.string().uuid(),
  description: z.string().trim().max(5000).nullable().optional(), approverId: z.string().uuid().nullable().optional(), approverName: z.string().trim().max(160).nullable().optional(),
  dueDate: z.string().date(), status: z.enum(["draft", "sent", "in_review"]).default("draft"), attachments: z.array(z.record(z.string(), z.unknown())).max(20).default([]),
}).strict().refine((value) => value.approverId || value.approverName, { path: ["approverId"], message: "An approver is required." });
export const activityApprovalPatchSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(), stageId: z.string().uuid().optional(), description: z.string().trim().max(5000).nullable().optional(),
  approverId: z.string().uuid().nullable().optional(), approverName: z.string().trim().max(160).nullable().optional(), dueDate: z.string().date().optional(),
  status: z.enum(["draft", "sent", "in_review", "cancelled"]).optional(), attachments: z.array(z.record(z.string(), z.unknown())).max(20).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "At least one field is required.");
export const approvalDecisionSchema = z.object({ decision: z.enum(["approved", "changes_required", "rejected"]), comment: z.string().trim().max(5000).optional() }).strict();
export const activityCommentSchema = z.object({ body: z.string().trim().min(1).max(5000), attachments: z.array(z.record(z.string(), z.unknown())).max(10).default([]) }).strict();

export const articleFeedbackSchema = z.object({ helpful: z.boolean() }).strict();
export const supportTicketSchema = z.object({
  issueType: z.string().trim().min(1).max(80), subject: z.string().trim().min(1).max(200), description: z.string().trim().min(1).max(10000),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"), status: z.enum(["draft", "open"]).default("open"),
}).strict();
export const supportTicketPatchSchema = z.object({ status: z.enum(["open", "in_progress", "waiting_on_user", "resolved", "closed"]) }).strict();

export const costingCategorySchema = z.object({
  name: z.string().trim().min(1).max(120), code: z.string().trim().min(1).max(40).regex(/^[A-Za-z0-9-]+$/),
  parentId: z.string().uuid().nullable().optional(), defaultUnit: z.string().trim().min(1).max(40),
  defaultTaxPercent: percent.default(18), defaultMarkupPercent: percent.default(0), defaultWastePercent: percent.default(0),
  transportIncluded: z.boolean().default(false), labourIncluded: z.boolean().default(false), description: z.string().trim().max(2000).nullable().optional(),
}).strict();
export const costingCategoryPatchSchema = costingCategorySchema.partial().strict().refine((value) => Object.keys(value).length > 0, "At least one field is required.");

export const costingItemSchema = z.object({
  name: z.string().trim().min(1).max(200), code: z.string().trim().min(1).max(60).regex(/^[A-Za-z0-9-]+$/),
  categoryId: z.string().uuid(), unit: z.string().trim().min(1).max(40), baseCost: money, sellingRate: money,
  preferredVendor: z.string().trim().max(160).nullable().optional(), spec: z.string().trim().max(1000).nullable().optional(),
  rateStatus: z.enum(["draft", "active", "expired"]).default("draft"), imageUrl: z.string().url().max(2048).nullable().optional(),
}).strict();
export const costingItemPatchSchema = costingItemSchema.partial().strict().refine((value) => Object.keys(value).length > 0, "At least one field is required.");

export const vendorQuoteSchema = z.object({
  itemId: z.string().uuid(), vendorName: z.string().trim().min(1).max(160), quote: money,
  leadTimeDays: z.number().int().min(0).max(3650), rating: z.coerce.number().min(0).max(5).nullable().optional(),
}).strict();
export const vendorSelectionSchema = z.object({ selected: z.boolean().default(true) }).strict();

export const costingScenarioSchema = z.object({
  name: z.string().trim().min(1).max(160), boqId: z.string().uuid(), description: z.string().trim().max(2000).nullable().optional(),
  type: z.enum(["full_cost", "value_engineering", "vendor_switch", "custom"]).default("full_cost"),
  adjustments: z.array(z.object({ itemId: z.string().uuid(), quantity: z.coerce.number().positive().optional(), rate: money.optional(), markupPercent: percent.optional() }).strict()).max(500).default([]),
}).strict();
export const costingScenarioPatchSchema = costingScenarioSchema.partial().strict().refine((value) => Object.keys(value).length > 0, "At least one field is required.");

export const boqImportSchema = z
  .object({
    fileName: z.string().trim().min(1).max(255),
    fileType: z.enum(["csv", "xlsx", "xls"]),
    rowCount: z.number().int().min(0).max(100_000),

    columns: z
      .array(z.string().trim().min(1).max(120))
      .max(100),

    rows: z
      .array(
        z.array(
          z.union([
            z.string(),
            z.number(),
            z.boolean(),
            z.null(),
          ])
        )
      )
      .max(10_000)
      .optional(),

    projectId: z.string().uuid().optional(),
  })
  .strict();

const uuid = z.string().uuid();

const optionalNullableUuid = uuid.nullable().optional();

const isoDate = z.string().date();

export const proposalCreateSchema = z
  .object({
    projectId: optionalNullableUuid,
    projectName: z.string().trim().min(1).max(200),
    clientName: z.string().trim().min(1).max(200),

    sourceType: z
      .enum(["scratch", "boq", "duplicate", "template"])
      .default("scratch"),

    sourceId: optionalNullableUuid,

    sourceLabel: z
      .string()
      .trim()
      .min(1)
      .max(240)
      .nullable()
      .optional(),

    proposedValue: z.coerce
      .number()
      .finite()
      .min(0)
      .max(9999999999999999),

    expiryDate: isoDate.nullable().optional(),

    internalNotes: z
      .string()
      .trim()
      .max(5000)
      .nullable()
      .optional(),

    scopeItems: z
      .array(z.string().trim().min(1).max(500))
      .max(100)
      .optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.sourceType !== "scratch" && !value.sourceId) {
      ctx.addIssue({
        code: "custom",
        path: ["sourceId"],
        message: "sourceId is required for this source type.",
      });
    }
  });

export const proposalPatchSchema = z
  .object({
    projectId: optionalNullableUuid,
    projectName: z.string().trim().min(1).max(200).optional(),
    clientName: z.string().trim().min(1).max(200).optional(),

    proposedValue: z.coerce
      .number()
      .finite()
      .min(0)
      .max(9999999999999999)
      .optional(),

    expiryDate: isoDate.nullable().optional(),

    internalNotes: z
      .string()
      .trim()
      .max(5000)
      .nullable()
      .optional(),

    scopeItems: z
      .array(z.string().trim().min(1).max(500))
      .max(100)
      .optional(),
  })
  .strict();

export const proposalStatusSchema = z
  .object({
    status: z.enum([
      "draft",
      "sent",
      "approved",
      "revisions",
      "won",
      "lost",
    ]),
  })
  .strict();

export const folderCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    parentId: optionalNullableUuid,
  })
  .strict();

export const folderPatchSchema = z
  .object({
    name: z.string().trim().min(1).max(160).optional(),
    parentId: optionalNullableUuid,
  })
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field is required."
  );

export const folderDeleteSchema = z
  .object({
    confirmation: z.string().trim().min(1).max(160),
  })
  .strict();

export const documentPatchSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    folderId: uuid.optional(),
    projectId: optionalNullableUuid,
    projectName: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .nullable()
      .optional(),
  })
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field is required."
  );

const invoiceItemSchema = z
  .object({
    description: z.string().trim().min(1).max(500),
    quantity: z.coerce
      .number()
      .finite()
      .positive()
      .max(999999999),

    rate: z.coerce
      .number()
      .finite()
      .min(0)
      .max(999999999999),
  })
  .strict();

/**
 * Base invoice schema.
 *
 * Keep this as a normal Zod object because invoicePatchSchema
 * needs to call .partial() on it.
 *
 * IMPORTANT:
 * Do not add .refine() or .superRefine() here.
 * .partial() must be called before refinements are added.
 */
const invoiceBaseSchema = z
  .object({
    type: z.enum(["invoice", "pro_forma", "quote"]),

    clientId: optionalNullableUuid,

    clientName: z
      .string()
      .trim()
      .min(1)
      .max(200),

    billingAddress: z
      .object({
        line1: z.string().trim().min(1).max(240),
        line2: z.string().trim().max(240).nullable().optional(),
        city: z.string().trim().min(1).max(120),
        state: z.string().trim().min(1).max(120),
        pincode: z.string().trim().min(3).max(20),
      })
      .strict(),

    projectId: optionalNullableUuid,

    projectName: z
      .string()
      .trim()
      .min(1)
      .max(200),

    // Friend's latest backend change
    invoiceNumber: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .optional(),

    issueDate: isoDate,

    dueDate: isoDate,

    milestone: z
      .string()
      .trim()
      .min(1)
      .max(200),

    reference: z
      .string()
      .trim()
      .max(200)
      .nullable()
      .optional(),

    taxRate: z.coerce
      .number()
      .finite()
      .min(0)
      .max(100)
      .default(18),

    additionalNotes: z
      .string()
      .trim()
      .max(5000)
      .nullable()
      .optional(),

    bankDetails: z
      .object({
        bankName: z.string().trim().min(1).max(160),
        accountHolder: z.string().trim().min(1).max(160),
        accountNumber: z.string().trim().min(1).max(40),
        ifscCode: z.string().trim().min(1).max(20),
        branch: z.string().trim().max(160).nullable().optional(),
        branchAddress: z.string().trim().max(300).nullable().optional(),
      })
      .strict()
      .nullable()
      .optional(),

    status: z
      .enum(["draft", "pending"])
      .default("draft"),

    items: z
      .array(invoiceItemSchema)
      .min(1)
      .max(200),
  })
  .strict();

/**
 * Invoice creation validation.
 */
export const invoiceCreateSchema = invoiceBaseSchema.superRefine(
  (value, ctx) => {
    if (value.dueDate < value.issueDate) {
      ctx.addIssue({
        code: "custom",
        path: ["dueDate"],
        message: "Due date cannot be before issue date.",
      });
    }
  }
);

/**
 * Invoice patch validation.
 *
 * IMPORTANT:
 * invoiceBaseSchema is still a normal Zod object here,
 * so .partial() works correctly.
 */
export const invoicePatchSchema = invoiceBaseSchema
  .partial()
  .strict()
  .superRefine((value, ctx) => {
    if (Object.keys(value).length === 0) {
      ctx.addIssue({
        code: "custom",
        path: [],
        message: "At least one field is required.",
      });
    }

    if (
      value.issueDate &&
      value.dueDate &&
      value.dueDate < value.issueDate
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["dueDate"],
        message: "Due date cannot be before issue date.",
      });
    }
  });

export const invoiceStatusSchema = z
  .object({
    status: z.enum([
      "draft",
      "pending",
      "sent",
      "accepted",
      "void",
    ]),
  })
  .strict();

export const paymentCreateSchema = z
  .object({
    amount: z.coerce
      .number()
      .finite()
      .positive()
      .max(9999999999999999),

    paidAt: z
      .string()
      .datetime({ offset: true })
      .optional(),

    method: z.enum([
      "cash",
      "bank_transfer",
      "card",
      "upi",
      "cheque",
      "other",
    ]),

    reference: z
      .string()
      .trim()
      .max(200)
      .nullable()
      .optional(),

    notes: z
      .string()
      .trim()
      .max(1000)
      .nullable()
      .optional(),
  })
  .strict();

export function fieldErrors(error: z.ZodError) {
  const result: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const key = issue.path.join(".") || "body";
    (result[key] ??= []).push(issue.message);
  }

  return result;
}

