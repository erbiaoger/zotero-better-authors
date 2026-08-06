import type { HttpClient } from "./http";

export class CrossrefClient {
  constructor(private readonly http: HttpClient, private readonly email?: string) {}

  async workByDoi(doi: string): Promise<any | null> {
    const query = this.email ? `?mailto=${encodeURIComponent(this.email)}` : "";
    try { const response = await this.http.request(`https://api.crossref.org/works/${encodeURIComponent(doi)}${query}`, { headers: { Accept: "application/json" } }); return response?.message || null; }
    catch (_e) { return null; }
  }
}
