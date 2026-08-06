import type { InstitutionRecord } from "./types";
import { countryCodeToFlag } from "./countryFlags";

// Conservative built-in names for common institutions. Unknown names are
// translated only when an unambiguous organization suffix can be converted;
// otherwise the original canonical name is retained.
const KNOWN_ZH: Record<string, string> = {
  "university of michigan": "密歇根大学",
  "university of calgary": "卡尔加里大学",
  "naples federico ii": "那不勒斯费德里科二世大学",
  "japan agency for marine-earth science and technology": "日本海洋地球科学技术机构",
  "jilin province": "吉林省",
  "hebrew university": "希伯来大学",
  "tongji university": "同济大学",
  "bp": "英国石油公司",
  "los alamos national laboratory": "洛斯阿拉莫斯国家实验室",
  "southern university": "南方大学",
  "colorado school of mines": "科罗拉多矿业学院",
  "rice university": "莱斯大学",
  "joint base san antonio": "圣安东尼奥联合基地",
  "china university of geosciences": "中国地质大学",
  "tsinghua university": "清华大学",
  "peking university": "北京大学",
  "stanford university": "斯坦福大学",
  "university of rhode island": "罗德岛大学",
  "university of houston": "休斯顿大学",
  "massachusetts institute of technology": "麻省理工学院",
  "lawrence berkeley national laboratory": "劳伦斯伯克利国家实验室",
  "chinese academy of sciences": "中国科学院",
  "eth zurich": "苏黎世联邦理工学院",
  "swiss federal institute of technology zurich": "苏黎世联邦理工学院",
};

const KNOWN_COUNTRIES: Record<string, string> = {
  "university of michigan": "US",
  "university of calgary": "CA",
  "naples federico ii": "IT",
  "japan agency for marine-earth science and technology": "JP",
  "jilin province": "CN",
  "hebrew university": "IL",
  "tongji university": "CN",
  "bp": "GB",
  "los alamos national laboratory": "US",
  "southern university": "US",
  "colorado school of mines": "US",
  "rice university": "US",
  "joint base san antonio": "US",
  "china university of geosciences": "CN",
  "tsinghua university": "CN",
  "peking university": "CN",
  "stanford university": "US",
  "university of rhode island": "US",
  "university of houston": "US",
  "massachusetts institute of technology": "US",
  "lawrence berkeley national laboratory": "US",
  "chinese academy of sciences": "CN",
  "eth zurich": "CH",
  "swiss federal institute of technology zurich": "CH",
};

export function inferInstitutionCountryCode(institution: InstitutionRecord): string | undefined {
  const code = institution.countryCode?.trim().toUpperCase();
  if (code && /^[A-Z]{2}$/.test(code)) return code;
  return KNOWN_COUNTRIES[institution.name.trim().toLowerCase()];
}

export function translateInstitutionName(institution: InstitutionRecord): string {
  if (institution.nameZh?.trim()) return institution.nameZh.trim();
  const original = institution.name.trim();
  const known = KNOWN_ZH[original.toLowerCase()];
  if (known) return known;

  // Do not fabricate mixed-language names for unknown proper nouns.
  return original;
}

export function formatInstitutionChineseColumn(institutions: InstitutionRecord[]): string {
  if (!institutions.length) return "";
  const institution = institutions[0];
  const flag = countryCodeToFlag(inferInstitutionCountryCode(institution));
  const first = `${flag}${flag ? " " : ""}${translateInstitutionName(institution)}`;
  return institutions.length === 1 ? first : `${first} +${institutions.length - 1}`;
}
