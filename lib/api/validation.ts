
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

export const projectCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    clientName: z.string().trim().min(1).max(160),
    projectType: z.string().trim().min(1).max(80),
    status: z.enum(["active", "on_hold", "planning"]),
    location: z.string().trim().max(240).optional(),
  })
  .strict();

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

