import type { WorkIdentity } from "./types";

const DOI_URL_RE = /^https?:\/\/(?:dx\.)?doi\.org\//i;

export function normalizeDoi(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  let doi = value.trim();
  if (!doi) return undefined;
  doi = doi.replace(/^doi:\s*/i, "").replace(DOI_URL_RE, "");
  doi = doi.replace(/[\s\u200B]+/g, "").replace(/[.,;:)\]}]+$/g, "");
  return /^10\.\d{4,9}\/\S+$/i.test(doi) ? doi.toLowerCase() : undefined;
}

export function normalizeText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .normalize("NFKC")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeName(value: unknown): string {
  return normalizeText(value).replace(/\s+/g, "");
}

export function displayCreatorName(creator: _ZoteroTypes.Item.Creator): string {
  if (creator.fieldMode === 1) return String(creator.lastName || "").trim();
  const first = String(creator.firstName || "").trim();
  const last = String(creator.lastName || "").trim();
  return [first, last].filter(Boolean).join(" ");
}

export function getAuthorCreators(item: Zotero.Item): _ZoteroTypes.Item.Creator[] {
  const authorID = Zotero.CreatorTypes.getID("author");
  if (authorID === false) return [];
  return item
    .getCreators()
    .filter((creator) => creator.creatorTypeID === authorID);
}

export function getFirstAuthor(item: Zotero.Item): _ZoteroTypes.Item.Creator | null {
  return getAuthorCreators(item)[0] || null;
}

export function getItemIdentity(item: Zotero.Item): WorkIdentity | null {
  const firstAuthor = getFirstAuthor(item);
  const title = String(item.getField("title") || "").trim();
  if (!firstAuthor || !title) return null;

  let date = "";
  try {
    date = String(item.getField("date") || "");
  } catch (_e) {
    // Some item types do not expose date.
  }
  const yearMatch = date.match(/\b(18|19|20|21)\d{2}\b/);

  let venue: string | undefined;
  try {
    venue = String(item.getField("publicationTitle") || "").trim() || undefined;
  } catch (_e) {
    venue = undefined;
  }

  return {
    doi: normalizeDoi(item.getField("DOI")),
    title,
    year: yearMatch ? Number(yearMatch[0]) : undefined,
    venue,
    firstAuthor: displayCreatorName(firstAuthor),
  };
}

export function identityKey(identity: WorkIdentity): string {
  return [
    identity.doi || "",
    normalizeText(identity.title),
    identity.year || "",
    normalizeName(identity.firstAuthor),
  ].join("|");
}

export function stableHash(value: string): string {
  let hashA = 0x811c9dc5;
  let hashB = 0x01000193;
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    hashA ^= code;
    hashA = Math.imul(hashA, 0x01000193);
    hashB ^= code + i;
    hashB = Math.imul(hashB, 0x811c9dc5);
  }
  return `${(hashA >>> 0).toString(16).padStart(8, "0")}${(
    hashB >>> 0
  ).toString(16).padStart(8, "0")}`;
}

export async function createFingerprint(identity: WorkIdentity): Promise<string> {
  const value = identityKey(identity);
  try {
    const cryptoObject = (globalThis as any).crypto;
    if (cryptoObject?.subtle && typeof TextEncoder !== "undefined") {
      const bytes = new TextEncoder().encode(value);
      const digest = await cryptoObject.subtle.digest("SHA-256", bytes);
      return `sha256:${Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("")}`;
    }
  } catch (_e) {
    // Fall back to a deterministic hash in older Zotero runtimes.
  }
  return `stable:${stableHash(value)}`;
}

export function levenshteinSimilarity(left: string, right: string): number {
  const a = normalizeText(left);
  const b = normalizeText(right);
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  if (a === b) return 1;

  const previous = new Array<number>(b.length + 1);
  const current = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) previous[j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const substitution = previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1);
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, substitution);
    }
    for (let j = 0; j <= b.length; j += 1) previous[j] = current[j];
  }
  return 1 - previous[b.length] / Math.max(a.length, b.length);
}

export function authorNameSimilarity(left: string, right: string): number {
  const a = normalizeName(left);
  const b = normalizeName(right);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.endsWith(b) || b.endsWith(a)) return 0.92;

  const leftParts = normalizeText(left).split(" ").filter(Boolean);
  const rightParts = normalizeText(right).split(" ").filter(Boolean);
  if (!leftParts.length || !rightParts.length) return 0;
  const leftLast = leftParts[leftParts.length - 1];
  const rightLast = rightParts[rightParts.length - 1];
  const leftFamily = leftParts.includes(rightLast) ? rightLast : leftLast;
  const rightFamily = rightParts.includes(leftLast) ? leftLast : rightLast;
  if (leftFamily !== rightFamily && !leftLast.startsWith(rightLast) && !rightLast.startsWith(leftLast)) return 0;
  const leftInitial = leftParts[0]?.[0] || "";
  const rightInitial = rightParts[0]?.[0] || "";
  const swappedInitial = leftParts[0]?.[0] === rightParts[rightParts.length - 1]?.[0] || rightParts[0]?.[0] === leftParts[leftParts.length - 1]?.[0];
  return leftInitial === rightInitial || swappedInitial ? 0.88 : 0.75;
}

export function scoreWorkCandidate(
  local: WorkIdentity,
  candidate: WorkIdentity,
): number {
  const titleScore = levenshteinSimilarity(local.title, candidate.title);
  const authorScore = authorNameSimilarity(local.firstAuthor, candidate.firstAuthor);
  const yearScore = local.year && candidate.year && local.year === candidate.year ? 1 : 0;
  const venueScore = local.venue && candidate.venue
    ? levenshteinSimilarity(local.venue, candidate.venue)
    : 0;
  return 0.55 * titleScore + 0.25 * authorScore + 0.15 * yearScore + 0.05 * venueScore;
}
