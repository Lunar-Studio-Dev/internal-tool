import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    const body = await req.json();

    if (!body.quotationId) {
        return Response.json({ success: false, error: "Missing quotationId" });
    }

    try {
        const updateData: Record<string, any> = {};

        if (body.status) {
            updateData.status = body.status;
        }

        if (body.content) {
            updateData.content = body.content;
        }

        const quotation = await prisma.quotation.update({
            where: { id: body.quotationId },
            data: updateData,
        });

        console.log("QUOTATION UPDATED: ", quotation.id, "→", updateData.status ?? "no status change");
        return Response.json({ success: true });
    } catch (error) {
        console.error("Quotation webhook error: ", error);
        return Response.json({ success: false, error: "Failed to update quotation" }, { status: 500 });
    }
}