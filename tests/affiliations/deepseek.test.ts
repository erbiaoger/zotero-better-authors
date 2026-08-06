import { describe, expect, it } from "vitest";
import { DeepSeekClient, parseTranslationResponse } from "../../src/affiliations/sources/deepseek";

describe("DeepSeek institution translation", () => {
  it("parses JSON and fenced JSON responses", () => {
    expect(parseTranslationResponse("```json\n[{\"id\":\"I1\",\"nameZh\":\"清华大学\"}]\n```")[0].nameZh).toBe("清华大学");
    expect(parseTranslationResponse(JSON.stringify({ translations: [{ id: "I2", nameZh: "斯坦福大学" }] }))[0].id).toBe("I2");
  });

  it("uses the requested deepseek-v4-flash model", async () => {
    let body = "";
    const client = new DeepSeekClient("secret", { request: async (_url, options) => { body = String(options?.body || ""); return { choices: [{ message: { content: "[]" } }] }; } });
    await client.translateInstitutions([{ id: "I1", name: "Tsinghua University" }]);
    expect(JSON.parse(body).model).toBe("deepseek-v4-flash");
  });
});
