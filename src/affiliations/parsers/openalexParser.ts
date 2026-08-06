import type { AuthorshipRecord, InstitutionRecord } from "../types";

function institution(raw: any, source: "openalex" = "openalex"): InstitutionRecord {
  const id = raw?.id || raw?.openalex_id;
  const ror = raw?.ror || raw?.ids?.ror;
  const canonicalId = ror || id || `raw:${String(raw?.display_name || "unknown").toLowerCase()}`;
  return { canonicalId, ror: ror || undefined, openAlexId: id || undefined, wikidata: raw?.ids?.wikidata || undefined,
    name: raw?.display_name || raw?.name || "Unknown institution", countryCode: raw?.country_code || undefined,
    latitude: raw?.geo?.latitude, longitude: raw?.geo?.longitude, parentId: raw?.parent?.id || undefined,
    parentName: raw?.parent?.display_name || undefined, lineage: raw?.lineage || undefined,
    rawAffiliations: [], source, confidence: ror ? 1 : 0.96 };
}

export function parseOpenAlexWork(work: any): AuthorshipRecord[] {
  return (work?.authorships || []).map((authorship: any, index: number) => {
    const institutions = (authorship.institutions || []).map((raw: any) => institution(raw));
    return { authorIndex: index, authorName: authorship.author?.display_name || "", authorPosition: authorship.author_position || (index === 0 ? "first" : "unknown"), orcid: authorship.author?.orcid || undefined, institutions };
  });
}
