import { describe, expect, it } from "vitest";
import { authorNameSimilarity, levenshteinSimilarity, normalizeDoi, scoreWorkCandidate } from "../../src/affiliations/domain";

describe("affiliation matching primitives", () => {
  it("normalizes DOI and accents", () => {
    expect(normalizeDoi(" DOI: https://doi.org/10.1234/ABC.1. ")).toBe("10.1234/abc.1");
    expect(levenshteinSimilarity("École Polytechnique", "ecole polytechnique")).toBe(1);
  });
  it("accepts initials and CJK-compatible author strings", () => {
    expect(authorNameSimilarity("Zhiyu Zhang", "Zhang Z.")).toBeGreaterThan(0.7);
  });
  it("uses the documented title candidate weights", () => {
    expect(scoreWorkCandidate({ title: "Deep learning seismic imaging", firstAuthor: "Zhang Zhiyu", year: 2024 }, { title: "Deep learning seismic imaging", firstAuthor: "Zhang Z.", year: 2024 })).toBeGreaterThan(0.9);
  });
});
