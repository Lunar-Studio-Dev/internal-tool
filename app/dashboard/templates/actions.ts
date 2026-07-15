"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function getTemplates() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  
  if (!session) {
    throw new Error("Unauthorized");
  }
  
  return prisma.template.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" }
  });
}

export async function createTemplate(formData: FormData) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  
  if (!session) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const content = formData.get("content") as string;

  const template = await prisma.template.create({
    data: {
      name,
      description,
      content,
      userId: session.user.id
    }
  });
  
  revalidatePath("/dashboard/templates");
  return template;
}

export async function deleteTemplate(id: string) {
   const reqHeaders = await headers();
   const session = await auth.api.getSession({ headers: reqHeaders });
   
   if (!session) throw new Error("Unauthorized");
   
   await prisma.template.delete({
     where: { id, userId: session.user.id }
   });
   
   revalidatePath("/dashboard/templates");
}
