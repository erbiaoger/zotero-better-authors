import { describe, expect, it } from "vitest";
import { getMinimalJournalAbbreviation } from "../../src/journals/abbreviation";

function item(publicationTitle: string, journalAbbreviation = "") {
  return {
    getField(field: string) {
      if (field === "publicationTitle") return publicationTitle;
      if (field === "journalAbbreviation") return journalAbbreviation;
      return "";
    },
  };
}

describe("minimal journal abbreviation", () => {
  it("maps Journal of Geophysical Research to JGR", () => {
    expect(
      getMinimalJournalAbbreviation(item("Journal of Geophysical Research")),
    ).toBe("JGR");
    expect(
      getMinimalJournalAbbreviation(item("Journal of Geophysics Research")),
    ).toBe("JGR");
  });

  it("allows a manually entered Zotero abbreviation to override the mapping", () => {
    expect(
      getMinimalJournalAbbreviation(
        item("Journal of Geophysical Research", "JGR Custom"),
      ),
    ).toBe("JGR Custom");
  });

  it("keeps a compact section abbreviation", () => {
    expect(
      getMinimalJournalAbbreviation(
        item("Journal of Geophysical Research: Solid Earth"),
      ),
    ).toBe("JGR Solid Earth");
  });

  it("uses a compact Zotero abbreviation for an unknown title", () => {
    expect(
      getMinimalJournalAbbreviation(
        item("A Journal With A Long Name", "AJWALN"),
      ),
    ).toBe("AJWALN");
  });

  it("falls back to deterministic initials without network access", () => {
    expect(
      getMinimalJournalAbbreviation(item("Advanced Methods in Earth Science")),
    ).toBe("AMES");
  });

  it("compresses dotted abbreviations", () => {
    expect(
      getMinimalJournalAbbreviation(
        item("An Unknown Venue", "J. Geophys. Res."),
      ),
    ).toBe("JGR");
  });
});
