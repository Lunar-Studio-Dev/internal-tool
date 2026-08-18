"use server";

import { revalidatePath } from "next/cache";

import {
  createTaskSchema,
  reassignTaskSchema,
  updateTaskSchema,
} from "@/features/tasks/schemas/task.schema";
import { TaskStatus } from "@/generated/prisma/enums";
import { logActivity } from "@/lib/activity";
import { requirePermission } from "@/lib/auth/member";
import { db } from "@/lib/db";

export type ActionResult = { ok: true } | { ok: false; error: string };
export type CreateTaskResult = { ok: true; id: string } | { ok: false; error: string };

function emptyToNull(value?: string | null): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed.length ? trimmed : null;
}

function parseDue(value?: string | null): Date | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}

function revalidateTaskContexts(task: { businessId: string | null; pipelineId: string | null }) {
  revalidatePath("/todos");
  if (task.businessId) revalidatePath(`/businesses/${task.businessId}`);
  if (task.pipelineId) revalidatePath(`/pipelines/${task.pipelineId}`);
}

export async function createTaskAction(input: unknown): Promise<CreateTaskResult> {
  const member = await requirePermission("task:write");

  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;

  try {
    const task = await db.task.create({
      data: {
        title: d.title,
        assigneeId: emptyToNull(d.assigneeId),
        createdById: member.id,
        dueAt: parseDue(d.dueAt),
        priority: d.priority,
        businessId: emptyToNull(d.businessId),
        pipelineId: emptyToNull(d.pipelineId),
        phaseType: d.phaseType ? d.phaseType : null,
        notes: emptyToNull(d.notes),
      },
    });
    await logActivity({
      actorId: member.id,
      action: "task.created",
      entityType: "Task",
      entityId: task.id,
      businessId: task.businessId,
      pipelineId: task.pipelineId,
      metadata: { title: task.title },
    });
    revalidateTaskContexts(task);
    return { ok: true, id: task.id };
  } catch {
    return { ok: false, error: "Could not create the task." };
  }
}

export async function updateTaskAction(input: unknown): Promise<ActionResult> {
  const member = await requirePermission("task:write");

  const parsed = updateTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;

  try {
    const task = await db.task.update({
      where: { id: d.id },
      data: {
        title: d.title,
        assigneeId: emptyToNull(d.assigneeId),
        dueAt: parseDue(d.dueAt),
        priority: d.priority,
        status: d.status,
        businessId: emptyToNull(d.businessId),
        pipelineId: emptyToNull(d.pipelineId),
        phaseType: d.phaseType ? d.phaseType : null,
        notes: emptyToNull(d.notes),
      },
    });
    await logActivity({
      actorId: member.id,
      action: "task.updated",
      entityType: "Task",
      entityId: task.id,
      businessId: task.businessId,
      pipelineId: task.pipelineId,
      metadata: { title: task.title },
    });
    revalidateTaskContexts(task);
    revalidatePath(`/todos/${d.id}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not update the task." };
  }
}

async function transitionStatus(
  id: string,
  status: TaskStatus,
  action: string,
): Promise<ActionResult> {
  const member = await requirePermission("task:write");
  const existing = await db.task.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Task not found." };

  const task = await db.task.update({ where: { id }, data: { status } });
  await logActivity({
    actorId: member.id,
    action,
    entityType: "Task",
    entityId: id,
    businessId: task.businessId,
    pipelineId: task.pipelineId,
    metadata: { title: task.title },
  });
  revalidateTaskContexts(task);
  revalidatePath(`/todos/${id}`);
  return { ok: true };
}

export async function completeTaskAction(id: string): Promise<ActionResult> {
  return transitionStatus(id, TaskStatus.COMPLETED, "task.completed");
}

export async function cancelTaskAction(id: string): Promise<ActionResult> {
  return transitionStatus(id, TaskStatus.CANCELLED, "task.cancelled");
}

export async function reassignTaskAction(input: unknown): Promise<ActionResult> {
  const member = await requirePermission("task:write");

  const parsed = reassignTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await db.task.findUnique({ where: { id: parsed.data.id } });
  if (!existing) return { ok: false, error: "Task not found." };

  const task = await db.task.update({
    where: { id: parsed.data.id },
    data: { assigneeId: parsed.data.assigneeId },
  });
  await logActivity({
    actorId: member.id,
    action: "task.reassigned",
    entityType: "Task",
    entityId: task.id,
    businessId: task.businessId,
    pipelineId: task.pipelineId,
    metadata: { title: task.title },
  });
  revalidateTaskContexts(task);
  revalidatePath(`/todos/${parsed.data.id}`);
  return { ok: true };
}
