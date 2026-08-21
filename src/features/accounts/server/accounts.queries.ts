import "server-only";

import type { TransactionListFilters } from "@/features/accounts/schemas/transaction.schema";
import { sumPaymentsForQuotation } from "@/features/payments/server/payments.queries";
import {
  ClientDecision,
  QuotationVersionStatus,
  TransactionType,
} from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/auth/member";
import { db } from "@/lib/db";
import { memberNameMap } from "@/lib/lookups";

export type FinanceSummary = {
  earningPaise: number;
  expensePaise: number;
  netPaise: number;
  outstandingPaise: number;
};

export type MonthlyAmount = {
  month: string;
  label: string;
  amountPaise: number;
};

export type MonthlyComparison = {
  month: string;
  label: string;
  earningPaise: number;
  expensePaise: number;
};

export type TransactionListItem = {
  id: string;
  type: TransactionType;
  amount: number;
  date: Date;
  category: string | null;
  expenseCategory: string | null;
  description: string | null;
  reference: string | null;
  businessId: string | null;
  businessName: string | null;
  pipelineId: string | null;
  pipelineCode: string | null;
  quotationId: string | null;
  createdByName: string | null;
  fromPayment: boolean;
};

export type OutstandingItem = {
  pipelineId: string;
  pipelineCode: string;
  pipelineName: string;
  businessId: string;
  businessName: string;
  quotationId: string;
  quotationVersion: number;
  requiredPaise: number;
  receivedPaise: number;
  remainingPaise: number;
};

export type AccountsFormOptions = {
  businesses: Array<{ id: string; name: string; website: string | null }>;
  pipelines: Array<{ id: string; code: string; name: string; businessId: string }>;
  quotations: Array<{
    id: string;
    pipelineId: string;
    version: number;
    subtotal: number;
  }>;
};

const MONTH_LABEL = new Intl.DateTimeFormat("en-IN", { month: "short" });

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return MONTH_LABEL.format(new Date(year, month - 1, 1));
}

function lastMonths(count: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKey(d));
  }
  return keys;
}

export async function financeSummary(): Promise<FinanceSummary> {
  await requirePermission("accounts:read");

  const [earn, exp, outstandingPaise] = await Promise.all([
    db.transaction.aggregate({
      where: { type: TransactionType.EARNING },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: { type: TransactionType.EXPENSE },
      _sum: { amount: true },
    }),
    computeOutstandingTotal(),
  ]);

  const earningPaise = earn._sum.amount ?? 0;
  const expensePaise = exp._sum.amount ?? 0;

  return {
    earningPaise,
    expensePaise,
    netPaise: earningPaise - expensePaise,
    outstandingPaise,
  };
}

async function computeOutstandingTotal(): Promise<number> {
  const items = await listOutstanding();
  return items.reduce((sum, row) => sum + row.remainingPaise, 0);
}

export async function listOutstanding(): Promise<OutstandingItem[]> {
  await requirePermission("accounts:read");

  const pipelines = await db.pipeline.findMany({
    where: {
      decision: { decision: ClientDecision.ACCEPTED },
    },
    select: {
      id: true,
      code: true,
      name: true,
      businessId: true,
      business: { select: { name: true } },
      quotations: {
        where: { status: QuotationVersionStatus.CURRENT },
        select: { id: true, version: true, subtotal: true },
        take: 1,
      },
    },
    orderBy: { code: "asc" },
  });

  const items: OutstandingItem[] = [];

  for (const pipeline of pipelines) {
    const quotation = pipeline.quotations[0];
    if (!quotation || quotation.subtotal <= 0) continue;

    const receivedPaise = await sumPaymentsForQuotation(pipeline.id, quotation.id);
    const remainingPaise = Math.max(0, quotation.subtotal - receivedPaise);
    if (remainingPaise <= 0) continue;

    items.push({
      pipelineId: pipeline.id,
      pipelineCode: pipeline.code,
      pipelineName: pipeline.name,
      businessId: pipeline.businessId,
      businessName: pipeline.business.name,
      quotationId: quotation.id,
      quotationVersion: quotation.version,
      requiredPaise: quotation.subtotal,
      receivedPaise,
      remainingPaise,
    });
  }

  return items.sort((a, b) => b.remainingPaise - a.remainingPaise);
}

export async function listTransactions(
  filters: TransactionListFilters = {},
): Promise<TransactionListItem[]> {
  await requirePermission("accounts:read");

  const where: Prisma.TransactionWhereInput = {};

  if (filters.type && filters.type !== "ALL") {
    where.type = filters.type;
  }
  if (filters.businessId) {
    where.businessId = filters.businessId;
  }
  if (filters.fromDate || filters.toDate) {
    where.date = {};
    if (filters.fromDate) {
      where.date.gte = new Date(filters.fromDate);
    }
    if (filters.toDate) {
      const end = new Date(filters.toDate);
      end.setHours(23, 59, 59, 999);
      where.date.lte = end;
    }
  }
  if (filters.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { description: { contains: q, mode: "insensitive" } },
      { category: { contains: q, mode: "insensitive" } },
      { reference: { contains: q, mode: "insensitive" } },
      { business: { name: { contains: q, mode: "insensitive" } } },
      { pipeline: { code: { contains: q, mode: "insensitive" } } },
    ];
  }

  const rows = await db.transaction.findMany({
    where,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: {
      business: { select: { name: true } },
      pipeline: { select: { code: true } },
      payment: { select: { id: true } },
    },
  });

  const names = await memberNameMap(rows.map((r) => r.createdById));

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    amount: row.amount,
    date: row.date,
    category: row.category,
    expenseCategory: row.expenseCategory,
    description: row.description,
    reference: row.reference,
    businessId: row.businessId,
    businessName: row.business?.name ?? null,
    pipelineId: row.pipelineId,
    pipelineCode: row.pipeline?.code ?? null,
    quotationId: row.quotationId,
    createdByName: row.createdById ? (names.get(row.createdById) ?? null) : null,
    fromPayment: Boolean(row.payment),
  }));
}

export async function listRecentTransactions(limit = 8): Promise<TransactionListItem[]> {
  return (await listTransactions()).slice(0, limit);
}

export async function getTransactionById(id: string): Promise<TransactionListItem | null> {
  await requirePermission("accounts:read");

  const row = await db.transaction.findUnique({
    where: { id },
    include: {
      business: { select: { name: true } },
      pipeline: { select: { code: true } },
      payment: { select: { id: true } },
    },
  });
  if (!row) return null;

  const names = await memberNameMap([row.createdById]);

  return {
    id: row.id,
    type: row.type,
    amount: row.amount,
    date: row.date,
    category: row.category,
    expenseCategory: row.expenseCategory,
    description: row.description,
    reference: row.reference,
    businessId: row.businessId,
    businessName: row.business?.name ?? null,
    pipelineId: row.pipelineId,
    pipelineCode: row.pipeline?.code ?? null,
    quotationId: row.quotationId,
    createdByName: row.createdById ? (names.get(row.createdById) ?? null) : null,
    fromPayment: Boolean(row.payment),
  };
}

export async function revenueByMonth(months = 6): Promise<MonthlyAmount[]> {
  await requirePermission("accounts:read");

  const since = new Date();
  since.setMonth(since.getMonth() - (months - 1), 1);
  since.setHours(0, 0, 0, 0);

  const rows = await db.transaction.findMany({
    where: {
      type: TransactionType.EARNING,
      date: { gte: since },
    },
    select: { amount: true, date: true },
  });

  const buckets = new Map<string, number>();
  for (const row of rows) {
    const key = monthKey(row.date);
    buckets.set(key, (buckets.get(key) ?? 0) + row.amount);
  }

  return lastMonths(months).map((key) => ({
    month: key,
    label: monthLabel(key),
    amountPaise: buckets.get(key) ?? 0,
  }));
}

export async function earningsVsExpensesByMonth(months = 6): Promise<MonthlyComparison[]> {
  await requirePermission("accounts:read");

  const since = new Date();
  since.setMonth(since.getMonth() - (months - 1), 1);
  since.setHours(0, 0, 0, 0);

  const rows = await db.transaction.findMany({
    where: { date: { gte: since } },
    select: { amount: true, date: true, type: true },
  });

  const earningBuckets = new Map<string, number>();
  const expenseBuckets = new Map<string, number>();

  for (const row of rows) {
    const key = monthKey(row.date);
    if (row.type === TransactionType.EARNING) {
      earningBuckets.set(key, (earningBuckets.get(key) ?? 0) + row.amount);
    } else {
      expenseBuckets.set(key, (expenseBuckets.get(key) ?? 0) + row.amount);
    }
  }

  return lastMonths(months).map((key) => ({
    month: key,
    label: monthLabel(key),
    earningPaise: earningBuckets.get(key) ?? 0,
    expensePaise: expenseBuckets.get(key) ?? 0,
  }));
}

export async function listAccountsFormOptions(): Promise<AccountsFormOptions> {
  await requirePermission("accounts:read");

  const [businesses, pipelines, quotations] = await Promise.all([
    db.business.findMany({
      select: { id: true, name: true, website: true },
      orderBy: { name: "asc" },
    }),
    db.pipeline.findMany({
      select: { id: true, code: true, name: true, businessId: true },
      orderBy: { code: "desc" },
    }),
    db.quotation.findMany({
      where: { status: QuotationVersionStatus.CURRENT },
      select: { id: true, pipelineId: true, version: true, subtotal: true },
      orderBy: { version: "desc" },
    }),
  ]);

  return { businesses, pipelines, quotations };
}
