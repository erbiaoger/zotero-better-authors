import type { ExtraAffiliationMirrorV1, FirstAuthorAffiliationRecord, InstitutionRecord } from "./types";
import { countryCodeToFlag } from "./countryFlags";
import { inferInstitutionCountryCode, selectPrimaryInstitution } from "./institutionTranslation";

export { countryCodeToFlag } from "./countryFlags";

export const EXTRA_PREFIX = "BetterAuthors-Affiliation:";

function isMirror(value: unknown): value is ExtraAffiliationMirrorV1 {
  const mirror = value as ExtraAffiliationMirrorV1;
  return !!mirror && mirror.version === 1 && typeof mirror.fingerprint === "string" &&
    typeof mirror.firstAuthor === "string" && Array.isArray(mirror.institutions) &&
    typeof mirror.updatedAt === "string";
}

export function parseExtraMirror(extra: unknown): { mirror: ExtraAffiliationMirrorV1 | null; conflicts: string[] } {
  const conflicts: string[] = [];
  if (typeof extra !== "string") return { mirror: null, conflicts };
  const mirrors: ExtraAffiliationMirrorV1[] = [];
  for (const rawLine of extra.split(/\r?\n/)) {
    const line = rawLine.trimStart();
    if (!line.startsWith(EXTRA_PREFIX)) continue;
    try {
      const value = JSON.parse(line.slice(EXTRA_PREFIX.length).trim());
      if (isMirror(value)) mirrors.push(value);
      else conflicts.push("invalid-version");
    } catch (_e) {
      conflicts.push("invalid-json");
    }
  }
  if (!mirrors.length) return { mirror: null, conflicts };
  mirrors.sort((a, b) => Number(b.manual) - Number(a.manual) || b.updatedAt.localeCompare(a.updatedAt));
  if (mirrors.length > 1) conflicts.push("multiple-mirrors");
  return { mirror: mirrors[0], conflicts };
}

export function serializeExtraMirror(mirror: ExtraAffiliationMirrorV1): string {
  return `${EXTRA_PREFIX} ${JSON.stringify(mirror)}`;
}

export function upsertExtraMirror(extra: unknown, mirror: ExtraAffiliationMirrorV1): string {
  const lines = typeof extra === "string" ? extra.split(/\r?\n/) : [];
  const kept = lines.filter((line) => !line.startsWith(EXTRA_PREFIX));
  while (kept.length && !kept[kept.length - 1].trim()) kept.pop();
  kept.push(serializeExtraMirror(mirror));
  return kept.join("\n");
}

export function mirrorFromRecord(record: FirstAuthorAffiliationRecord): ExtraAffiliationMirrorV1 {
  const first = record.authorships.find((author) => author.authorPosition === "first") || record.authorships[0];
  return {
    version: 1,
    fingerprint: record.fingerprint,
    firstAuthor: record.identity.firstAuthor,
    institutions: first?.institutions || [],
    manual: record.manual,
    updatedAt: record.updatedAt || new Date().toISOString(),
  };
}

export function formatInstitutionColumn(institutions: InstitutionRecord[]): string {
  if (!institutions.length) return "";
  const institution = selectPrimaryInstitution(institutions) || institutions[0];
  const flag = countryCodeToFlag(inferInstitutionCountryCode(institution));
  const first = `${flag}${flag ? " " : ""}${institution.name}`;
  return institutions.length === 1 ? first : `${first} +${institutions.length - 1}`;
}
