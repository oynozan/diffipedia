import { getWinkComparison } from "@/lib/compare-engines";

export async function POST(req: Request): Promise<Response> {
    const { grokipedia, wikipedia } = await req.json();

    if (!grokipedia || !wikipedia) {
        return Response.json(
            {
                status: false,
                message: "Both grokipedia and wikipedia content are required",
            },
            { status: 400 },
        );
    }

    const comparison = await getWinkComparison(grokipedia, wikipedia);

    if (!comparison) {
        return Response.json({
            status: false,
            message: "Failed to compute wink-nlp comparison results",
        });
    }

    return Response.json(comparison);
}


