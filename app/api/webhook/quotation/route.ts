import prisma from "@/lib/prisma";


export async function POST(req: Request) {
    const body = await req.json();

    if (!body.name || !body.content || !body.requirements || !body.userId || !body.templateId) {
        return Response.json({ success: false, error: "Missing required fields" });
    }

    console.log("{QUOTATION}: ", body.content)
    try {
        const quotation = await prisma.quotation.create({
            data: {
                name: body.name,
                description: body.description,
                content: body.content,
                requirements: body.requirements,
                userId: body.userId,
                templateId: body.templateId
            }
        })
        if (!quotation.id) {
            return Response.json({ success: false, error: "Failed to save quotation" });
        }

        console.log("QUOTATION SAVED: ", quotation)
        return Response.json({ success: true });
    } catch (error) {
        console.log("QUotation ERROR: ", error)
        return Response.json({ success: false, error: "Failed to save quotation" });
    }
}