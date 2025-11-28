import ArticlesNav from "@/components/Article/Nav";
import JsonLdPanel from "@/components/JsonLdPanel";
import DKG from "@/lib/dkg";
import { searchType } from "@/utils/helpers";
import { redirect } from "next/navigation";

type Params = {
  params: Promise<{
    ual: string;
  }>;
};

const extractString = (source: Record<string, unknown> | null, key: string): string | null => {
  if (!source) return null;
  const value = source[key];
  return typeof value === "string" ? value : null;
};

const extractDiffipediaSummary = (source: Record<string, unknown> | null): string | null => {
  if (!source) return null;
  const diffipediaSection = source["diffipedia"];
  if (
    diffipediaSection &&
    typeof diffipediaSection === "object" &&
    "summary" in diffipediaSection &&
    typeof (diffipediaSection as Record<string, unknown>)["summary"] === "string"
  ) {
    return (diffipediaSection as Record<string, unknown>)["summary"] as string;
  }
  return null;
};

export default async function UalPage({ params }: Params) {
  const { ual } = await params;
  const decodedUal = decodeURIComponent(ual).trim();

  if (!decodedUal) {
    redirect("/");
  }

  if (searchType(decodedUal) !== "ual") {
    redirect(`/diff/${encodeURIComponent(decodedUal)}`);
  }

  let assetPayload: Record<string, unknown> | null = null;
  let error: string | null = null;

  try {
    const asset = await DKG.getKnowledgeAsset(decodedUal.toLowerCase());
    const data = (asset?.data ?? null) as Record<string, unknown> | null;
    assetPayload =
      (data?.["private"] as Record<string, unknown> | undefined) ??
      (data?.["public"] as Record<string, unknown> | undefined) ??
      data ??
      null;
  } catch (err) {
    error =
      err instanceof Error ? err.message : "Unable to fetch the requested knowledge asset right now.";
  }

  const assetName = extractString(assetPayload, "name");
  const assetDescription = extractString(assetPayload, "description");
  const diffSummary = extractDiffipediaSummary(assetPayload);

  return (
    <div id="diff" className="flex h-full flex-col">
      <ArticlesNav />
      <div className="flex-1 overflow-y-auto px-6 py-8 text-white">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <div className="rounded-md border border-border bg-gray20/30 p-5">
            <p className="text-xs uppercase tracking-wide text-gray">Universal Asset Locator</p>
            <p className="mt-1 break-all font-mono text-sm text-white/90">{decodedUal}</p>
            {assetName && <p className="mt-4 text-2xl font-semibold">{assetName}</p>}
            {assetDescription && <p className="mt-2 text-sm text-gray">{assetDescription}</p>}
            {diffSummary && (
              <p className="mt-2 text-sm text-gray">
                <span className="font-semibold text-white/80">Diffipedia summary:</span> {diffSummary}
              </p>
            )}
          </div>

          {error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : (
            <>
              <JsonLdPanel
                jsonld={assetPayload}
                summaryLabel="Stored Diffipedia JSON-LD payload"
                defaultOpen
              />
              {!assetPayload && (
                <div className="rounded-md border border-border bg-black/20 p-4 text-sm text-gray">
                  Asset retrieved successfully, but no JSON-LD payload was found.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

