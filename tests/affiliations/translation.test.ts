import { describe, expect, it } from "vitest";
import { formatInstitutionChineseColumn, selectPrimaryInstitution, translateInstitutionName } from "../../src/affiliations/institutionTranslation";

const institution: any = (name: string, nameZh?: string) => ({ canonicalId: name, name, nameZh, rawAffiliations: [], source: "openalex", confidence: 1 });

describe("Chinese institution column", () => {
  it("uses known Chinese names and preserves canonical data", () => {
    expect(translateInstitutionName(institution("University of Rhode Island"))).toBe("罗德岛大学");
    expect(translateInstitutionName(institution("University of Michigan"))).toBe("密歇根大学");
    expect(translateInstitutionName(institution("Uppsala University"))).toBe("乌普萨拉大学");
    expect(translateInstitutionName(institution("Karlsruhe Institute of Technology"))).toBe("卡尔斯鲁厄理工学院");
    expect(translateInstitutionName(institution("Custom Institute", "自定义研究所"))).toBe("自定义研究所");
  });
  it("keeps the same multi-institution +N display convention", () => {
    expect(formatInstitutionChineseColumn([institution("Tsinghua University"), institution("Stanford University")])).toBe("🇨🇳 清华大学 +1");
    expect(formatInstitutionChineseColumn([institution("University of Edinburgh")])).toBe("🇬🇧 爱丁堡大学");
  });

  it("prefers a university over a laboratory in multi-affiliation display", () => {
    const lab = institution("State Key Laboratory of Deep Earth Exploration");
    const university = { ...institution("Jilin University"), type: "education" };
    expect(selectPrimaryInstitution([lab, university])?.name).toBe("Jilin University");
    expect(formatInstitutionChineseColumn([lab, university])).toBe("🇨🇳 吉林大学 +1");
  });
});
