/**
 * Local, deterministic journal-title abbreviation helpers.
 *
 * This module is intentionally synchronous: it is used by a Zotero item-tree
 * column and must never perform a network request while the list is rendered.
 * Known titles use compact, conventional abbreviations. For other titles we
 * first reuse Zotero's journalAbbreviation field and then generate a short
 * initials-based fallback.
 */

const KNOWN_ABBREVIATIONS: Record<string, string> = {
  "journal of geophysical research": "JGR",
  "journal of geophysics research": "JGR",
  "journal of geophysical research solid earth": "JGR Solid Earth",
  "journal of geophysical research atmospheres": "JGR Atmospheres",
  "journal of geophysical research oceans": "JGR Oceans",
  "journal of geophysical research biogeosciences": "JGR Biogeosciences",
  "journal of geophysical research planets": "JGR Planets",
  "journal of geophysical research space physics": "JGR Space Physics",
  "geophysical research letters": "GRL",
  "geophysical journal international": "GJI",
  "journal of applied geophysics": "J Appl Geophys",
  "seismological research letters": "SRL",
  "bulletin of the seismological society of america": "BSSA",
  "journal of seismology": "J Seismol",
  "earth and planetary science letters": "EPSL",
  "nature communications": "Nat Commun",
  "scientific reports": "Sci Rep",
  "remote sensing": "Remote Sens",
  "the cryosphere": "Cryosphere",
  "journal of structural geology": "J Struct Geol",
  "computers & geosciences": "Comput Geosci",
  "computers and geosciences": "Comput Geosci",
  interpretation: "Interpretation",
  geophysics: "Geophysics",
  "geophysical prospecting": "Geophys Prospect",
  "seismic exploration": "Seism Explor",
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "for",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
]);

export function normalizeJournalTitle(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function titleTokens(value: string): string[] {
  return normalizeJournalTitle(value)
    .split(" ")
    .filter((token) => token && !STOP_WORDS.has(token));
}

function initials(value: string): string {
  return titleTokens(value)
    .map((token) => token.slice(0, 1).toUpperCase())
    .join("");
}

function compactExistingAbbreviation(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  // Preserve already-established acronyms such as JGR, EPSL and IEEE.
  const compact = trimmed.replace(/[^\p{Letter}\p{Number}]+/gu, "");
  if (/^[A-Z0-9]{2,12}$/.test(compact)) return compact;

  // A user-entered spaced form such as “JGR Solid Earth” is already the
  // intended value; only compress punctuation-based citation forms below.
  if (!/[./-]/u.test(trimmed)) return trimmed;

  // Turn common dotted forms (e.g. “J. Geophys. Res.”) into JGR.
  const parts = trimmed
    .normalize("NFKC")
    .split(/[\s./-]+/u)
    .map((part) => part.replace(/[^\p{Letter}\p{Number}]/gu, ""))
    .filter(Boolean);
  if (parts.length >= 2) {
    const acronym = parts
      .map((part) => part.slice(0, 1).toUpperCase())
      .join("");
    if (acronym.length >= 2 && acronym.length <= 12) return acronym;
  }
  return trimmed;
}

function isUsableExistingAbbreviation(value: string, title: string): boolean {
  const candidate = value.trim();
  if (!candidate || candidate.length > 40) return false;
  if (normalizeJournalTitle(candidate) === normalizeJournalTitle(title))
    return false;
  return candidate.split(/\s+/u).length <= 8;
}

/**
 * Return the shortest practical abbreviation for a Zotero publication title.
 * The result is display-only; the item's publicationTitle/journalAbbreviation
 * fields are never modified.
 */
export function getMinimalJournalAbbreviation(item: {
  getField: (field: string) => unknown;
}): string {
  let title = "";
  let existing = "";
  try {
    title = String(item.getField("publicationTitle") || "").trim();
    existing = String(item.getField("journalAbbreviation") || "").trim();
  } catch (_e) {
    return "";
  }
  if (!title) return existing ? compactExistingAbbreviation(existing) : "";

  const existingCandidate = isUsableExistingAbbreviation(existing, title)
    ? compactExistingAbbreviation(existing)
    : "";
  const generated = initials(title);

  // Prefer a supplied standard abbreviation when it is already compact. Zotero
  // users may have curated a venue-specific form that is shorter or clearer
  // than generic initials (for example “J. Geophys. Res.” → “JGR”).
  if (existingCandidate) return existingCandidate;
  const known = KNOWN_ABBREVIATIONS[normalizeJournalTitle(title)];
  if (known) return known;
  if (generated.length >= 2) return generated;
  return existingCandidate || title;
}
