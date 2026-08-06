/** Independent SQLite cache. It never writes Zotero's main database. */
export class AffiliationDatabase {
  connection: _ZoteroTypes.DB;
  private path: string;

  constructor(path = `${Zotero.DataDirectory.dir}/better-authors.sqlite`) {
    this.path = path;
    this.connection = new Zotero.DBConnection(path);
  }

  async init(): Promise<void> {
    await this.connection.queryAsync(`CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)`);
    await this.connection.queryAsync(`CREATE TABLE IF NOT EXISTS work_cache (
      library_id INTEGER NOT NULL, item_key TEXT NOT NULL, fingerprint TEXT NOT NULL,
      identity_json TEXT NOT NULL, authorships_json TEXT NOT NULL, status TEXT NOT NULL,
      match_method TEXT, confidence REAL NOT NULL DEFAULT 0, source TEXT,
      error_code TEXT, error_message TEXT, updated_at TEXT NOT NULL, expires_at TEXT,
      manual INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (library_id, item_key))`);
    await this.connection.queryAsync(`CREATE TABLE IF NOT EXISTS authorships (
      library_id INTEGER NOT NULL, item_key TEXT NOT NULL, author_index INTEGER NOT NULL,
      author_json TEXT NOT NULL, PRIMARY KEY (library_id, item_key, author_index))`);
    await this.connection.queryAsync(`CREATE TABLE IF NOT EXISTS institutions (
      canonical_id TEXT PRIMARY KEY, institution_json TEXT NOT NULL)`);
    await this.connection.queryAsync(`CREATE TABLE IF NOT EXISTS authorship_institutions (
      library_id INTEGER NOT NULL, item_key TEXT NOT NULL, author_index INTEGER NOT NULL,
      canonical_id TEXT NOT NULL, relation_json TEXT NOT NULL,
      PRIMARY KEY (library_id, item_key, author_index, canonical_id))`);
    await this.connection.queryAsync(`CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY, payload_json TEXT NOT NULL, status TEXT NOT NULL,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`);
    await this.connection.queryAsync(`CREATE TABLE IF NOT EXISTS manual_overrides (
      library_id INTEGER NOT NULL, item_key TEXT NOT NULL, override_json TEXT NOT NULL,
      updated_at TEXT NOT NULL, PRIMARY KEY (library_id, item_key))`);
  }

  async close(): Promise<void> {
    const connection = this.connection as any;
    if (typeof connection.closeDatabase === "function") await connection.closeDatabase();
  }
}
