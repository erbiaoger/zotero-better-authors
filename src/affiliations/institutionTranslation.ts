import type { InstitutionRecord } from "./types";

// Conservative built-in names for common institutions. Unknown names are
// translated only when an unambiguous organization suffix can be converted;
// otherwise the original canonical name is retained.
const KNOWN_ZH: Record<string, string> = {
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

export function translateInstitutionName(institution: InstitutionRecord): string {
  if (institution.nameZh?.trim()) return institution.nameZh.trim();
  const original = institution.name.trim();
  const known = KNOWN_ZH[original.toLowerCase()];
  if (known) return known;

  // Handle only high-confidence English organization patterns. This keeps
  // proper names intact instead of producing misleading word-by-word output.
  let match = original.match(/^University of (.+)$/i);
  if (match) return `${match[1]}大学`;
  match = original.match(/^(.+) University$/i);
  if (match) return `${match[1]}大学`;
  match = original.match(/^Institute of (.+)$/i);
  if (match) return `${match[1]}研究所`;
  match = original.match(/^(.+) Institute$/i);
  if (match) return `${match[1]}研究所`;
  if (/National Laboratory$/i.test(original)) return original.replace(/National Laboratory$/i, "国家实验室");
  if (/Academy of Sciences$/i.test(original)) return original.replace(/Academy of Sciences$/i, "科学院");
  return original;
}

export function formatInstitutionChineseColumn(institutions: InstitutionRecord[]): string {
  if (!institutions.length) return "";
  const first = translateInstitutionName(institutions[0]);
  return institutions.length === 1 ? first : `${first} +${institutions.length - 1}`;
}
