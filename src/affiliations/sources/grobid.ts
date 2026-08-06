import type { HttpClient } from "./http";

export class GrobidClient {
  constructor(private readonly baseURL: string, private readonly http: HttpClient) {}

  async processHeader(pdfPath: string): Promise<string> {
    return this.process("processHeaderDocument", pdfPath);
  }

  async processFulltext(pdfPath: string): Promise<string> {
    return this.process("processFulltextDocument", pdfPath);
  }

  private async process(endpoint: string, pdfPath: string): Promise<string> {
    const form = new FormData();
    const io = (globalThis as any).IOUtils;
    const bytes = io?.read ? await io.read(pdfPath) : new Uint8Array();
    form.append("input", new Blob([bytes], { type: "application/pdf" }), "document.pdf");
    form.append("includeRawAffiliations", "1");
    form.append("consolidateHeader", "0");
    const response: any = await this.http.request(`${this.baseURL.replace(/\/$/, "")}/${endpoint}`, { method: "POST", body: form, timeout: 120000, headers: { Accept: "application/xml" } });
    return typeof response === "string" ? response : response?.xml || "";
  }
}
