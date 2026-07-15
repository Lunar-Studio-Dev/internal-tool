"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { generateQuotation } from "@/ai";

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

  // Compile final content: Base Template Markdown + Client Requirements
  const finalContent = await generateQuotation(template.content, data.requirements)

  const quotation = await prisma.quotation.create({
    data: {
      name: data.name,
      description: data.description,
      requirements: data.requirements,
      content: finalContent,
      templateId: data.templateId,
      userId: session.user.id
    }
  });
  
  revalidatePath("/dashboard/quotations");
  return quotation;
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
