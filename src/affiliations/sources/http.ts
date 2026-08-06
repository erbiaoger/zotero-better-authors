export interface HttpClient {
  request(url: string, options?: { method?: string; headers?: Record<string, string>; body?: unknown; timeout?: number }): Promise<any>;
}

export const zoteroHttpClient: HttpClient = {
  async request(url, options = {}) {
    const xhr: any = await (Zotero.HTTP as any).request(options.method || "GET", url, {
      headers: options.headers,
      body: options.body,
      timeout: options.timeout || 30000,
      responseType: "text",
      successCodes: false,
    });
    const status = Number(xhr?.status || 200);
    if (status < 200 || status >= 300) {
      const error: any = new Error(`HTTP ${status}`);
      error.status = status;
      error.retryAfter = xhr?.getResponseHeader?.("Retry-After");
      throw error;
    }
    const text = typeof xhr === "string" ? xhr : xhr?.responseText ?? xhr?.response ?? "";
    if (!text) return {};
    try { return JSON.parse(text); } catch (_e) { return text; }
  },
};
