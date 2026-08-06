import { normalizeDoi } from "../domain";
import type { HttpClient } from "./http";

export interface OpenAlexWork { [key: string]: any }

export class OpenAlexClient {
  constructor(private readonly apiKey: string, private readonly http: HttpClient) {}

  private url(path: string): string {
    const join = path.includes("?") ? "&" : "?";
    return `https://api.openalex.org${path}${join}api_key=${encodeURIComponent(this.apiKey)}`;
  }

  async worksByDoi(dois: string[]): Promise<OpenAlexWork[]> {
    if (!dois.length) return [];
    const filter = dois.map((doi) => `doi:${doi}`).join("|");
    const response = await this.http.request(this.url(`/works?filter=${encodeURIComponent(filter)}&per-page=50`));
    return response?.results || [];
  }

  async workByDoi(doi: string): Promise<OpenAlexWork | null> {
    try { return await this.http.request(this.url(`/works/https://doi.org/${encodeURIComponent(doi)}`)); }
    catch (_e) { return null; }
  }

  async searchWorks(title: string): Promise<OpenAlexWork[]> {
    const response = await this.http.request(this.url(`/works?search=${encodeURIComponent(title)}&per-page=5`));
    return response?.results || [];
  }

  async institutions(ids: string[]): Promise<any[]> {
    const unique = [...new Set(ids.filter(Boolean))];
    if (!unique.length) return [];
    const filter = unique.map((id) => id.startsWith("https://openalex.org/") ? id : `https://openalex.org/${id}`).join("|");
    const response = await this.http.request(this.url(`/institutions?filter=${encodeURIComponent(`openalex_id:${filter}`)}&per-page=100`));
    return response?.results || [];
  }
}

export function openAlexDoi(work: OpenAlexWork): string | undefined {
  return normalizeDoi(work?.doi || work?.ids?.doi);
}
