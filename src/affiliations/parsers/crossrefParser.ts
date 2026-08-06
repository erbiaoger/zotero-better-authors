import type { AuthorshipRecord, InstitutionRecord } from "../types";

export function parseCrossrefWork(work: any): AuthorshipRecord[] {
  return (work?.author || []).map((author: any, index: number) => {
    const institutions: InstitutionRecord[] = (author.affiliation || []).map((affiliation: any) => {
      const name = typeof affiliation === "string" ? affiliation : affiliation?.name || "";
      const ror = typeof affiliation === "object" ? affiliation?.id?.["https://ror.org"] || affiliation?.ror : undefined;
      return { canonicalId: ror || `raw:${name.toLowerCase()}`, ror, name, rawAffiliations: [name], source: "crossref", confidence: ror ? 0.95 : 0.8 };
    });
    return { authorIndex: index, authorName: [author.given, author.family].filter(Boolean).join(" "), authorPosition: index === 0 ? "first" : "unknown", orcid: author.ORCID, institutions };
  });
}
