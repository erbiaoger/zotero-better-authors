import { getPref } from "../../utils/prefs";
import { authorNameSimilarity, createFingerprint, getItemIdentity, normalizeDoi, scoreWorkCandidate } from "../domain";
import { formatInstitutionColumn, mirrorFromRecord, parseExtraMirror, upsertExtraMirror } from "../extraMirror";
import { parseCrossrefWork } from "../parsers/crossrefParser";
import { parseGrobidTei } from "../parsers/grobidTeiParser";
import { parseOpenAlexWork } from "../parsers/openalexParser";
import { affiliationDatabase, affiliationRepository } from "../storage";
import type { AuthorshipRecord, BatchSummary, DashboardOptions, DashboardScope, EnrichmentOptions, FirstAuthorAffiliationRecord, InstitutionRecord, ReviewCandidate } from "../types";
import { CrossrefClient } from "../sources/crossref";
import { GrobidClient } from "../sources/grobid";
import { zoteroHttpClient } from "../sources/http";
import { OpenAlexClient } from "../sources/openalex";
import { aggregateRecords } from "../analytics/stats";

const memory = new Map<string, FirstAuthorAffiliationRecord>();
const reviews = new Map<string, ReviewCandidate>();
const keyFor = (libraryID: number, itemKey: string) => `${libraryID}:${itemKey}`;

function firstAuthor(authorships: AuthorshipRecord[]): AuthorshipRecord | undefined {
  return authorships.find((a) => a.authorPosition === "first") || authorships[0];
}

function itemIdentityFromOpenAlex(work: any) {
  const first = work?.authorships?.[0]?.author?.display_name || "";
  return { doi: normalizeDoi(work?.doi), title: work?.title || work?.display_name || "", year: work?.publication_year, venue: work?.primary_location?.source?.display_name, firstAuthor: first };
}

function recordFor(item: Zotero.Item, fingerprint: string, identity: any, authorships: AuthorshipRecord[], status: FirstAuthorAffiliationRecord["status"], method?: FirstAuthorAffiliationRecord["matchMethod"], confidence = 0, source?: FirstAuthorAffiliationRecord["source"], errorMessage?: string): FirstAuthorAffiliationRecord {
  const now = new Date();
  const successful = status === "succeeded" || status === "needs_review";
  return { libraryID: item.libraryID, itemKey: item.key, fingerprint, identity, authorships, status, matchMethod: method, confidence, source, errorMessage, updatedAt: now.toISOString(), expiresAt: new Date(now.getTime() + (successful ? 365 : 30) * 86400000).toISOString(), manual: false };
}

export class AffiliationServiceImpl {
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    await affiliationDatabase.init();
    for (const record of await affiliationRepository.list()) memory.set(keyFor(record.libraryID, record.itemKey), record);
    this.initialized = true;
    // Extra mirrors are the cross-device transport. Hydrate them lazily so startup and scrolling stay synchronous.
    void this.hydrateMirrorsInBackground();
  }

  private async hydrateMirrorsInBackground(): Promise<void> {
    try {
      for (const library of Zotero.Libraries.getAll()) {
        const ids = await Zotero.Items.getAll(library.libraryID, true, false, true);
        for (let index = 0; index < ids.length; index += 1) {
          try { await this.hydrateItem(Zotero.Items.get(ids[index])); } catch (_e) { /* keep one malformed item from stopping hydration */ }
          if (index % 25 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }
    } catch (_e) { /* Zotero may still be opening a library during startup */ }
  }

  async shutdown(): Promise<void> { if (this.initialized) await affiliationDatabase.close(); this.initialized = false; }

  getFirstAuthorRecord(libraryID: number, itemKey: string): FirstAuthorAffiliationRecord | null {
    return memory.get(keyFor(libraryID, itemKey)) || null;
  }

  async hydrateItem(item: Zotero.Item): Promise<void> {
    const identity = getItemIdentity(item);
    if (!identity) return;
    const fingerprint = await createFingerprint(identity);
    const key = keyFor(item.libraryID, item.key);
    const existing = memory.get(key) || await affiliationRepository.get(item.libraryID, item.key);
    if (existing && existing.fingerprint === fingerprint) { memory.set(key, existing); return; }
    const parsed = parseExtraMirror(item.getField("extra"));
    if (parsed.mirror && parsed.mirror.fingerprint === fingerprint) {
      const authorships: AuthorshipRecord[] = [{ authorIndex: 0, authorName: identity.firstAuthor, authorPosition: "first", institutions: parsed.mirror.institutions }];
      const record = recordFor(item, fingerprint, identity, authorships, "succeeded", "extra-mirror", Math.max(...parsed.mirror.institutions.map((i) => i.confidence), 0), parsed.mirror.institutions[0]?.source);
      record.manual = parsed.mirror.manual;
      memory.set(key, record);
      await affiliationRepository.save(record);
    }
  }

  async enrichItems(itemIDs: number[], options: EnrichmentOptions = {}): Promise<string> {
    await this.init();
    const batchID = `aff-${Date.now().toString(36)}`;
    const items = (Zotero.Items.get(itemIDs) as Zotero.Item[]).filter((item) => item?.isTopLevelItem?.() && item.isRegularItem?.() && !item.deleted);
    const summary: BatchSummary = { batchID, total: items.length, cached: 0, succeeded: 0, needsReview: 0, noMatch: 0, failed: 0, cancelled: 0, openAlexRequests: 0, crossrefRequests: 0, grobidRequests: 0 };
    const progress = new addon.data.ztoolkit.ProgressWindow("机构数据", { closeOnClick: false }).createLine({ text: `准备处理 ${items.length} 条`, progress: 0 }).show(-1);
    const key = String(getPref("openalex-api-key") || "").trim();
    if (!key) throw new Error("OpenAlex API Key 未配置，请在设置页填写。");
    const openalex = new OpenAlexClient(key, zoteroHttpClient);
    const crossref = new CrossrefClient(zoteroHttpClient, String(getPref("crossref-email") || "").trim() || undefined);
    const grobid = new GrobidClient(String(getPref("grobid-url") || "http://127.0.0.1:8070"), zoteroHttpClient);
    const identities = new Map<number, { item: Zotero.Item; identity: any; fingerprint: string }>();
    for (const item of items) {
      const identity = getItemIdentity(item); if (!identity) continue;
      const fingerprint = await createFingerprint(identity);
      identities.set(item.id, { item, identity, fingerprint });
      const cached = memory.get(keyFor(item.libraryID, item.key)) || await affiliationRepository.get(item.libraryID, item.key);
      if (!options.force && cached?.fingerprint === fingerprint && cached.expiresAt && cached.expiresAt > new Date().toISOString()) { memory.set(keyFor(item.libraryID, item.key), cached); summary.cached += 1; }
    }
    const doiItems = [...identities.values()].filter((x) => x.identity.doi && (options.force || !memory.has(keyFor(x.item.libraryID, x.item.key))));
    const works = new Map<string, any>();
    for (let start = 0; start < doiItems.length; start += 50) {
      const chunk = doiItems.slice(start, start + 50);
      try { summary.openAlexRequests += 1; for (const work of await openalex.worksByDoi(chunk.map((x) => x.identity.doi!))) { const doi = normalizeDoi(work.doi); if (doi) works.set(doi, work); } }
      catch (error) { if ((error as any)?.status === 401) throw new Error("OpenAlex API Key 无效（401）。"); }
    }
    for (const { item, identity, fingerprint } of identities.values()) {
      const existing = memory.get(keyFor(item.libraryID, item.key));
      if (!options.force && existing?.fingerprint === fingerprint && existing.status === "succeeded") continue;
      let authorships: AuthorshipRecord[] = [];
      let status: FirstAuthorAffiliationRecord["status"] = "no_match";
      let method: FirstAuthorAffiliationRecord["matchMethod"];
      let confidence = 0;
      let source: FirstAuthorAffiliationRecord["source"];
      let reviewReason = "";
      const work = identity.doi ? works.get(identity.doi) : null;
      if (work) {
        authorships = parseOpenAlexWork(work);
        const first = firstAuthor(authorships);
        if (first && authorNameSimilarity(identity.firstAuthor, first.authorName) < 0.7) reviewReason = "首作者不一致";
        else if (first?.institutions.length) { status = "succeeded"; method = "openalex-doi"; confidence = first.institutions[0].confidence; source = "openalex"; }
      }
      if (!identity.doi && !statusToAccept(status)) {
        const candidates = await openalex.searchWorks(identity.title); summary.openAlexRequests += 1;
        let best: { work: any; score: number } | null = null;
        for (const candidate of candidates) { const score = scoreWorkCandidate(identity, itemIdentityFromOpenAlex(candidate)); if (!best || score > best.score) best = { work: candidate, score }; }
        if (best && best.score >= 0.75) { authorships = parseOpenAlexWork(best.work); status = best.score >= 0.9 ? "succeeded" : "needs_review"; method = "openalex-title"; confidence = best.score; source = "openalex"; reviewReason = `标题候选分数 ${best.score.toFixed(3)}`; }
      }
      if (!statusToAccept(status) && identity.doi) {
        summary.crossrefRequests += 1;
        const crossrefWork = await crossref.workByDoi(identity.doi);
        authorships = parseCrossrefWork(crossrefWork);
        const first = firstAuthor(authorships);
        if (first?.institutions.length && authorNameSimilarity(identity.firstAuthor, first.authorName) >= 0.7) { status = "succeeded"; method = "crossref-doi"; confidence = first.institutions[0].confidence; source = "crossref"; }
      }
      if (!statusToAccept(status) && options.includeGrobid !== false && getPref("enable-grobid")) {
        const attachment = (await item.getBestAttachments()).find((a) => a.isPDFAttachment?.());
        const path = attachment ? await attachment.getFilePathAsync() : false;
        const base = String(getPref("grobid-url") || "http://127.0.0.1:8070");
        const remote = !/^https:\/\/|^http:\/\/127\.0\.0\.1|^http:\/\/localhost/i.test(base);
        if (path && (!remote || options.allowRemoteGrobid)) {
          try { summary.grobidRequests += 1; let xml = await grobid.processHeader(String(path)); authorships = parseGrobidTei(xml); if (!firstAuthor(authorships)?.institutions.length) { xml = await grobid.processFulltext(String(path)); authorships = parseGrobidTei(xml); method = "grobid-fulltext"; } else method = "grobid-header"; const first = firstAuthor(authorships); if (first?.institutions.length) { status = first.institutions[0].confidence >= 0.8 ? "succeeded" : "needs_review"; confidence = first.institutions[0].confidence; source = "grobid"; } }
          catch (_e) { /* network/PDF errors become a normal no_match result */ }
        }
      }
      const record = recordFor(item, fingerprint, identity, authorships, status, method, confidence, source, reviewReason || undefined);
      memory.set(keyFor(item.libraryID, item.key), record);
      await affiliationRepository.save(record);
      if (status === "succeeded") { summary.succeeded += 1; await this.writeMirror(item, record); }
      else if (status === "needs_review") { summary.needsReview += 1; reviews.set(keyFor(item.libraryID, item.key), { itemID: item.id, identity, method: method || "openalex-title", score: confidence, institutions: firstAuthor(authorships)?.institutions || [], reason: reviewReason }); }
      else summary.noMatch += 1;
      progress.changeLine({ text: `已处理 ${summary.succeeded + summary.needsReview + summary.noMatch}/${summary.total}`, progress: Math.round(((summary.succeeded + summary.needsReview + summary.noMatch) / Math.max(1, summary.total)) * 100) });
    }
    progress.changeLine({ type: "success", text: `机构数据完成：成功 ${summary.succeeded}，待审核 ${summary.needsReview}`, progress: 100 }).startCloseTimer(5000);
    return batchID;
  }

  private async writeMirror(item: Zotero.Item, record: FirstAuthorAffiliationRecord): Promise<void> {
    if (!item.isEditable?.("edit")) return;
    const mirror = mirrorFromRecord(record);
    const extra = upsertExtraMirror(item.getField("extra"), mirror);
    item.setField("extra", extra);
    await item.saveTx();
  }

  getReviewCandidates(): ReviewCandidate[] { return [...reviews.values()]; }

  async clearRecords(libraryID?: number): Promise<void> {
    await affiliationRepository.clear(libraryID);
    for (const [key, record] of memory) if (libraryID === undefined || record.libraryID === libraryID) memory.delete(key);
  }

  async getDashboardData(options: DashboardOptions): Promise<any> {
    const records = await affiliationRepository.list(options.scope.libraryID);
    const filtered = options.scope.itemIDs?.length ? records.filter((r) => options.scope.itemIDs!.some((id) => { try { return (Zotero.Items.get(id) as Zotero.Item).key === r.itemKey; } catch (_e) { return false; } })) : records;
    return aggregateRecords(filtered, options);
  }

  async acceptReview(libraryID: number, itemKey: string): Promise<void> {
    const record = memory.get(keyFor(libraryID, itemKey)); if (!record) return;
    record.status = "succeeded"; record.manual = true; record.matchMethod = "manual"; memory.set(keyFor(libraryID, itemKey), record); await affiliationRepository.save(record);
    const item = Zotero.Items.get(itemKey) as Zotero.Item; if (item) await this.writeMirror(item, record); reviews.delete(keyFor(libraryID, itemKey));
  }
}

function statusToAccept(status: FirstAuthorAffiliationRecord["status"]): boolean { return status === "succeeded" || status === "needs_review"; }

export const affiliationService = new AffiliationServiceImpl();
export function getInstitutionColumnValue(item: Zotero.Item): string {
  const record = affiliationService.getFirstAuthorRecord(item.libraryID, item.key);
  return formatInstitutionColumn(firstAuthor(record?.authorships || [])?.institutions || []);
}
