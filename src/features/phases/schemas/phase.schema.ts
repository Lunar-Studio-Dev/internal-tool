import { z } from "zod";

import { DEFAULT_CHECKLIST, QUESTIONNAIRE_TEMPLATES } from "@/features/phases/constants";
import { optionalText } from "@/lib/zod-fields";

const templateKeys = Object.keys(QUESTIONNAIRE_TEMPLATES) as [string, ...string[]];

export const discoveryChecklistSchema = z.object({
  understandBusiness: z.boolean(),
  painPoints: z.boolean(),
  softwareOpportunity: z.boolean(),
  canAddValue: z.boolean(),
});

export const saveDiscoverySchema = z.object({
  pipelineId: z.string().min(1),
  meetingAt: z.string().optional().or(z.literal("")),
  meetingLink: optionalText(500),
  meetingOwnerId: z.string().optional().or(z.literal("")),
  notes: optionalText(5000),
  checklist: discoveryChecklistSchema.default(DEFAULT_CHECKLIST),
});

export const saveUnderstandingSchema = z.object({
  pipelineId: z.string().min(1),
  model: optionalText(5000),
  operations: optionalText(5000),
  processes: optionalText(5000),
  painPoints: z.array(z.string().trim().min(1).max(500)).max(20).optional(),
  opportunities: z.array(z.string().trim().min(1).max(500)).max(20).optional(),
  stakeholders: z.array(z.string().trim().min(1).max(200)).max(20).optional(),
});

export const saveRequirementSchema = z.object({
  pipelineId: z.string().min(1),
  templateKey: z.enum(templateKeys).optional().or(z.literal("")),
  businessReq: optionalText(10000),
  functionalReq: optionalText(10000),
  technicalReq: optionalText(10000),
  features: z.array(z.string().trim().min(1).max(500)).max(50).optional(),
  users: z.array(z.string().trim().min(1).max(500)).max(50).optional(),
  integrations: optionalText(5000),
  timeline: optionalText(2000),
  constraints: optionalText(5000),
  questionnaire: z.record(z.string(), z.unknown()).optional(),
});

export const quotationLineItemSchema = z.object({
  item: z.string().trim().min(1, "Item is required").max(300),
  qty: z.coerce.number().positive("Qty must be positive"),
  ratePaise: z.coerce.number().int().nonnegative(),
  amountPaise: z.coerce.number().int().nonnegative(),
});

export const createQuotationSchema = z.object({
  pipelineId: z.string().min(1),
  title: z.string().trim().min(1, "Title is required").max(200),
  scope: optionalText(5000),
  items: z.array(quotationLineItemSchema).min(1, "Add at least one line item"),
  subtotalPaise: z.coerce.number().int().positive("Subtotal is required"),
  initialPaymentPaise: z.coerce.number().int().nonnegative(),
  paymentTerms: optionalText(2000),
  validUntil: z.string().optional().or(z.literal("")),
  publish: z.boolean().default(true),
});

export const clientDecisionSchema = z.object({
  pipelineId: z.string().min(1),
  decision: z.enum(["ACCEPTED", "REJECTED", "LATER"]),
  notes: optionalText(2000),
  reasonId: z.string().optional().or(z.literal("")),
  followUpDueAt: z.string().optional().or(z.literal("")),
  followUpReason: optionalText(500),
});

export const saveBusinessResearchSchema = z.object({
  pipelineId: z.string().min(1),
  researchNotes: optionalText(10000),
});
