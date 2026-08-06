import type { HttpClient } from "./http";

export interface InstitutionTranslationInput {
  id: string;
  name: string;
}

export interface InstitutionTranslationResult {
  id: string;
  nameZh: string;
}

export class DeepSeekClient {
  constructor(
    private readonly apiKey: string,
    private readonly http: HttpClient,
    private readonly model = "deepseek-v4-flash",
  ) {}

  async translateInstitutions(items: InstitutionTranslationInput[]): Promise<InstitutionTranslationResult[]> {
    if (!items.length) return [];
    const response = await this.http.request("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        stream: false,
        temperature: 0.1,
        messages: [
          { role: "system", content: "你是学术机构名称翻译器。把英文或其他语言的机构名称翻译成简洁、规范的简体中文。机构专名、城市名和国家名应使用常见中文译名。只返回 JSON 数组，每项格式为 {\"id\":\"原id\",\"nameZh\":\"中文机构名\"}，不要输出解释。" },
          { role: "user", content: JSON.stringify(items) },
        ],
      }),
      timeout: 60000,
    });
    const content = response?.choices?.[0]?.message?.content;
    return parseTranslationResponse(content);
  }
}

export function parseTranslationResponse(content: unknown): InstitutionTranslationResult[] {
  if (typeof content !== "string") return [];
  const cleaned = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  let parsed: unknown;
  try { parsed = JSON.parse(cleaned); } catch (_e) { return []; }
  const values = Array.isArray(parsed) ? parsed : (parsed && typeof parsed === "object" && Array.isArray((parsed as any).translations) ? (parsed as any).translations : []);
  return values.filter((value: any) => value && typeof value.id === "string" && typeof value.nameZh === "string" && value.nameZh.trim()).map((value: any) => ({ id: value.id, nameZh: value.nameZh.trim() }));
}
