"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import inngestClient from "@/inngest/client";

export async function getQuotations() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session) {
    throw new Error("Unauthorized");
  }

  return prisma.quotation.findMany({
    where: { userId: session.user.id },
    include: { template: true },
    orderBy: { createdAt: "desc" }
  });
}

export async function createQuotation(data: {
  name: string;
  description: string;
  requirements: string;
  templateId: string;
}) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session) throw new Error("Unauthorized");

    // Fetch the chosen template to merge the final document
    const template = await prisma.template.findUnique({
      where: { id: data.templateId, userId: session.user.id }
    });

    if (!template) {
      throw new Error("Template not found or unauthorized.");
    }

    console.log("QUOTATION WEBHOOK URL: ", process.env.QUOTATION_WEBHOOK_URL)

    await inngestClient.send({
      name: "app/generate-quotation",
      data: {
        name: data.name,
        description: data.description,
        requirements: data.requirements,
        templateId: data.templateId,
        userId: session.user.id,
        template: template.content,
        quotationWebhookUrl: process.env.QUOTATION_WEBHOOK_URL ?? "http://localhost:3000/api/webhook/quotation"
      }
    })

    revalidatePath("/dashboard/quotations");
    return { success: true };
  } catch (error: any) {
    console.error("[ACTION ERROR]: ", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}

export async function deleteQuotation(id: string) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session) throw new Error("Unauthorized");

  await prisma.quotation.delete({
    where: { id, userId: session.user.id }
  });

  revalidatePath("/dashboard/quotations");
}
