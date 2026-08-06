import type { FirstAuthorAffiliationRecord } from "../types";
import { AffiliationDatabase } from "./database";

export class AffiliationRepository {
  constructor(public readonly database: AffiliationDatabase) {}

  async save(record: FirstAuthorAffiliationRecord): Promise<void> {
    const now = record.updatedAt || new Date().toISOString();
    await this.database.connection.queryAsync(
      `INSERT OR REPLACE INTO work_cache
       (library_id,item_key,fingerprint,identity_json,authorships_json,status,match_method,confidence,source,error_code,error_message,updated_at,expires_at,manual)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [record.libraryID, record.itemKey, record.fingerprint, JSON.stringify(record.identity), JSON.stringify(record.authorships),
        record.status, record.matchMethod || null, record.confidence, record.source || null, record.errorCode || null,
        record.errorMessage || null, now, record.expiresAt || null, record.manual ? 1 : 0],
    );
    await this.database.connection.queryAsync(`DELETE FROM authorships WHERE library_id=? AND item_key=?`, [record.libraryID, record.itemKey]);
    for (const author of record.authorships) {
      await this.database.connection.queryAsync(`INSERT OR REPLACE INTO authorships VALUES (?,?,?,?)`, [record.libraryID, record.itemKey, author.authorIndex, JSON.stringify(author)]);
      for (const institution of author.institutions) {
        await this.database.connection.queryAsync(`INSERT OR REPLACE INTO institutions VALUES (?,?)`, [institution.canonicalId, JSON.stringify(institution)]);
        await this.database.connection.queryAsync(`INSERT OR REPLACE INTO authorship_institutions VALUES (?,?,?,?,?)`, [record.libraryID, record.itemKey, author.authorIndex, institution.canonicalId, JSON.stringify(institution)]);
      }
    }
  }

  async get(libraryID: number, itemKey: string): Promise<FirstAuthorAffiliationRecord | null> {
    const rows = await this.database.connection.queryAsync(`SELECT * FROM work_cache WHERE library_id=? AND item_key=?`, [libraryID, itemKey]);
    const row: any = rows?.[0];
    if (!row) return null;
    return { libraryID: Number(row.library_id), itemKey: String(row.item_key), fingerprint: String(row.fingerprint),
      identity: JSON.parse(String(row.identity_json)), authorships: JSON.parse(String(row.authorships_json)), status: row.status,
      matchMethod: row.match_method || undefined, confidence: Number(row.confidence || 0), source: row.source || undefined,
      errorCode: row.error_code || undefined, errorMessage: row.error_message || undefined, updatedAt: row.updated_at,
      expiresAt: row.expires_at || undefined, manual: Boolean(row.manual) };
  }

  async list(libraryID?: number): Promise<FirstAuthorAffiliationRecord[]> {
    const rows = await this.database.connection.queryAsync(libraryID === undefined ? `SELECT * FROM work_cache` : `SELECT * FROM work_cache WHERE library_id=?`, libraryID === undefined ? [] : [libraryID]);
    return (rows || []).map((row: any) => ({ libraryID: Number(row.library_id), itemKey: String(row.item_key), fingerprint: String(row.fingerprint), identity: JSON.parse(String(row.identity_json)), authorships: JSON.parse(String(row.authorships_json)), status: row.status, matchMethod: row.match_method || undefined, confidence: Number(row.confidence || 0), source: row.source || undefined, errorCode: row.error_code || undefined, errorMessage: row.error_message || undefined, updatedAt: row.updated_at, expiresAt: row.expires_at || undefined, manual: Boolean(row.manual) }));
  }

  async clear(libraryID?: number): Promise<void> {
    if (libraryID === undefined) await this.database.connection.queryAsync(`DELETE FROM work_cache`);
    else await this.database.connection.queryAsync(`DELETE FROM work_cache WHERE library_id=?`, [libraryID]);
  }
}
