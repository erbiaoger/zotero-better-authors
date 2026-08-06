import { describe, expect, it } from "vitest";
import { parseExtraMirror, upsertExtraMirror } from "../../src/affiliations/extraMirror";

const mirror: any = { version: 1, fingerprint: "sha256:x", firstAuthor: "Zhang Zhiyu", institutions: [], manual: false, updatedAt: "2026-01-01T00:00:00Z" };

describe("Extra mirror", () => {
  it("preserves unrelated Extra lines and writes one plugin line", () => {
    const value = upsertExtraMirror("Original: keep\n\n", mirror);
    expect(value).toContain("Original: keep");
    expect(parseExtraMirror(value).mirror?.fingerprint).toBe("sha256:x");
  });
  it("reports malformed JSON and chooses manual conflicts first", () => {
    const manual = { ...mirror, manual: true, updatedAt: "2025-01-01T00:00:00Z" };
    const parsed = parseExtraMirror(`BetterAuthors-Affiliation: {bad}\nBetterAuthors-Affiliation: ${JSON.stringify(mirror)}\nBetterAuthors-Affiliation: ${JSON.stringify(manual)}`);
    expect(parsed.conflicts).toContain("invalid-json");
    expect(parsed.mirror?.manual).toBe(true);
  });
});
