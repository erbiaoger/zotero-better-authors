import { describe, expect, it } from "vitest";
import { aggregateRecords } from "../../src/affiliations/analytics/stats";

describe("institution aggregation", () => {
  it("supports full and fractional counting with parent merge", () => {
    const records: any[] = [{ status: "succeeded", identity: { doi: "10/x", title: "A", firstAuthor: "A", year: 2024 }, authorships: [{ authorPosition: "first", institutions: [{ canonicalId: "child", name: "Child", parentId: "parent", parentName: "Parent", countryCode: "US" }, { canonicalId: "b", name: "B", countryCode: "CN" }] }] }];
    const full = aggregateRecords(records, { scope: { kind: "library" }, fullCount: true, mergeParents: true, deduplicate: true });
    const fractional = aggregateRecords(records, { scope: { kind: "library" }, fullCount: false, mergeParents: false, deduplicate: true });
    expect(full.institutions[0].name).toBe("Parent");
    expect(fractional.institutions[0].count).toBeCloseTo(0.5);
  });
});
