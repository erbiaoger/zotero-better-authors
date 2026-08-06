import type { DashboardOptions, FirstAuthorAffiliationRecord } from "../types";

export function aggregateRecords(records: FirstAuthorAffiliationRecord[], options: DashboardOptions): any {
  const counts = new Map<string, { name: string; count: number; countryCode?: string; latitude?: number; longitude?: number; parentId?: string; parentName?: string }>();
  const countries = new Map<string, number>();
  const seen = new Set<string>();
  const full = options.fullCount !== false;
  for (const record of records) {
    if (record.status !== "succeeded" && record.status !== "needs_review") continue;
    const identityKey = record.identity.doi || `${record.identity.title.toLowerCase()}|${record.identity.firstAuthor.toLowerCase()}|${record.identity.year || ""}`;
    if (options.deduplicate !== false && seen.has(identityKey)) continue;
    seen.add(identityKey);
    const first = record.authorships.find((a) => a.authorPosition === "first") || record.authorships[0];
    const institutions = first?.institutions || [];
    const weight = full ? 1 : institutions.length ? 1 / institutions.length : 0;
    for (const institution of institutions) {
      const useParent = options.mergeParents !== false && institution.parentId && institution.parentName;
      const id = useParent ? institution.parentId! : institution.canonicalId;
      const current = counts.get(id) || { name: useParent ? institution.parentName! : institution.name, count: 0, countryCode: institution.countryCode, latitude: institution.latitude, longitude: institution.longitude, parentId: institution.parentId, parentName: institution.parentName };
      current.count += weight; counts.set(id, current);
      if (institution.countryCode) countries.set(institution.countryCode, (countries.get(institution.countryCode) || 0) + weight);
    }
  }
  return { institutions: [...counts.entries()].map(([id, value]) => ({ id, ...value })).sort((a, b) => b.count - a.count), countries: [...countries.entries()].map(([countryCode, count]) => ({ countryCode, count })).sort((a, b) => b.count - a.count), coverage: { totalRecords: records.length, matched: records.filter((r) => r.status === "succeeded").length, needsReview: records.filter((r) => r.status === "needs_review").length, noCoordinates: [...counts.values()].filter((i) => i.latitude === undefined || i.longitude === undefined).length }, settings: { fullCount: full, mergeParents: options.mergeParents !== false, deduplicate: options.deduplicate !== false } };
}
