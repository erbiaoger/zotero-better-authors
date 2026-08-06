import { describe, expect, it } from "vitest";
import { formatInstitutionChineseColumn, translateInstitutionName } from "../../src/affiliations/institutionTranslation";

const institution: any = (name: string, nameZh?: string) => ({ canonicalId: name, name, nameZh, rawAffiliations: [], source: "openalex", confidence: 1 });

describe("Chinese institution column", () => {
  it("uses known Chinese names and preserves canonical data", () => {
    expect(translateInstitutionName(institution("University of Rhode Island"))).toBe("罗德岛大学");
    expect(translateInstitutionName(institution("University of Michigan"))).toBe("密歇根大学");
    expect(translateInstitutionName(institution("Custom Institute", "自定义研究所"))).toBe("自定义研究所");
  });
  it("keeps the same multi-institution +N display convention", () => {
    expect(formatInstitutionChineseColumn([institution("Tsinghua University"), institution("Stanford University")])).toBe("🇨🇳 清华大学 +1");
  });
});
