/**
 * Core types for first-author affiliation enrichment.
 *
 * The enrichment layer is intentionally independent from the Zotero UI. It
 * stores all authorship information locally, while the Extra mirror and the
 * item-tree column only expose the first author affiliations.
 */

export type AffiliationSource = "openalex" | "crossref" | "grobid" | "manual";

export type EnrichmentStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "needs_review"
  | "no_match"
  | "failed"
  | "cancelled";

export type MatchMethod =
  | "openalex-doi"
  | "openalex-title"
  | "crossref-doi"
  | "grobid-header"
  | "grobid-fulltext"
  | "manual"
  | "extra-mirror";

export interface InstitutionRecord {
  canonicalId: string;
  ror?: string;
  openAlexId?: string;
  wikidata?: string;
  isni?: string;
  name: string;
  /** Optional local/manual Chinese display name; canonical `name` remains unchanged. */
  nameZh?: string;
  type?: "education" | "facility" | "company" | "government" | "healthcare" | "other";
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  parentId?: string;
  parentName?: string;
  lineage?: string[];
  rawAffiliations: string[];
  source: AffiliationSource;
  confidence: number;
}

export interface AuthorshipRecord {
  authorIndex: number;
  authorName: string;
  authorPosition?: "first" | "middle" | "last" | "unknown";
  isCorresponding?: boolean;
  orcid?: string;
  institutions: InstitutionRecord[];
}

export interface WorkIdentity {
  doi?: string;
  title: string;
  year?: number;
  venue?: string;
  firstAuthor: string;
}

export interface FirstAuthorAffiliationRecord {
  libraryID: number;
  itemKey: string;
  fingerprint: string;
  identity: WorkIdentity;
  authorships: AuthorshipRecord[];
  status: EnrichmentStatus;
  matchMethod?: MatchMethod;
  confidence: number;
  source?: AffiliationSource;
  errorCode?: string;
  errorMessage?: string;
  updatedAt?: string;
  expiresAt?: string;
  manual: boolean;
}

export interface ExtraAffiliationMirrorV1 {
  version: 1;
  fingerprint: string;
  firstAuthor: string;
  institutions: InstitutionRecord[];
  manual: boolean;
  updatedAt: string;
}

export interface EnrichmentOptions {
  force?: boolean;
  allowRemoteGrobid?: boolean;
  includeGrobid?: boolean;
}

export interface DashboardScope {
  kind: "items" | "collection" | "library";
  itemIDs?: number[];
  collectionID?: number;
  libraryID?: number;
}

export interface DashboardOptions {
  scope: DashboardScope;
  fullCount?: boolean;
  deduplicate?: boolean;
  mergeParents?: boolean;
  minConfidence?: number;
}

export interface ReviewCandidate {
  itemID: number;
  identity: WorkIdentity;
  method: MatchMethod;
  score: number;
  title?: string;
  workId?: string;
  institutions: InstitutionRecord[];
  reason: string;
}

export interface BatchSummary {
  batchID: string;
  total: number;
  cached: number;
  succeeded: number;
  needsReview: number;
  noMatch: number;
  failed: number;
  cancelled: number;
  openAlexRequests: number;
  crossrefRequests: number;
  grobidRequests: number;
}
