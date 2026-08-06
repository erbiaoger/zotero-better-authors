import { describe, expect, it } from "vitest";
import { countryCodeToFlag, formatInstitutionColumn } from "../../src/affiliations/extraMirror";

describe("institution country flags", () => {
  it("converts ISO alpha-2 codes to flags", () => {
    expect(countryCodeToFlag("us")).toBe("🇺🇸");
    expect(countryCodeToFlag("CN")).toBe("🇨🇳");
    expect(countryCodeToFlag("unknown")).toBe("");
  });

  it("prefixes the displayed institution with its country flag", () => {
    expect(formatInstitutionColumn([{ canonicalId: "x", name: "University", countryCode: "US", rawAffiliations: [], source: "openalex", confidence: 1 }])).toBe("🇺🇸 University");
  });
});
