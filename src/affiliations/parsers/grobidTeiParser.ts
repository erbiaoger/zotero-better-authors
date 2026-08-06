import type { AuthorshipRecord, InstitutionRecord } from "../types";

function text(node: Element | null): string { return node?.textContent?.replace(/\s+/g, " ").trim() || ""; }

export function parseGrobidTei(xml: string): AuthorshipRecord[] {
  if (!xml) return [];
  const document = new DOMParser().parseFromString(xml, "application/xml");
  if (document.querySelector("parsererror")) return [];
  const affiliations = new Map<string, string>();
  for (const node of Array.from(document.getElementsByTagNameNS("*", "affiliation"))) {
    const key = node.getAttribute("xml:id") || node.getAttribute("id") || String(affiliations.size);
    affiliations.set(key, text(node));
  }
  const authors: AuthorshipRecord[] = [];
  for (const [index, author] of Array.from(document.getElementsByTagNameNS("*", "author")).entries()) {
    const name = text(author.getElementsByTagNameNS("*", "persName")[0]) || text(author);
    const refs = Array.from(author.getElementsByTagNameNS("*", "ptr")).map((node) => node.getAttribute("target")?.replace(/^#/, "") || "");
    const names = refs.length ? refs.map((ref) => affiliations.get(ref)).filter(Boolean) as string[] : [text(author.getElementsByTagNameNS("*", "affiliation")[0])].filter(Boolean);
    const institutions: InstitutionRecord[] = names.map((name) => ({ canonicalId: `raw:${name.toLowerCase()}`, name, rawAffiliations: [name], source: "grobid", confidence: refs.length ? 0.86 : 0.65 }));
    authors.push({ authorIndex: index, authorName: name, authorPosition: index === 0 ? "first" : "unknown", institutions });
  }
  return authors;
}
