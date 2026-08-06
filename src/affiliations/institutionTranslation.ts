import type { InstitutionRecord } from "./types";
import { countryCodeToFlag } from "./countryFlags";

// Conservative built-in names for common institutions. Unknown names are
// translated only when an unambiguous organization suffix can be converted;
// otherwise the original canonical name is retained.
const KNOWN_ZH: Record<string, string> = {
  "gfz helmholtz centre for geosciences": "GFZ亥姆霍兹地学研究中心",
  "gfz german research centre for geosciences": "GFZ德国地学研究中心",
  "helmholtz centre potsdam": "波茨坦亥姆霍兹中心",
  "uppsala university": "乌普萨拉大学",
  "university of edinburgh": "爱丁堡大学",
  "hokkaido university": "北海道大学",
  "centre national de la recherche scientifique": "法国国家科学研究中心",
  "centre national de la recherche scientifique (cnrs)": "法国国家科学研究中心",
  "united states geological survey": "美国地质调查局",
  "karlsruhe institute of technology": "卡尔斯鲁厄理工学院",
  "king fahd university of petroleum and minerals": "法赫德国王石油与矿产大学",
  "xiamen university": "厦门大学",
  "jilin university": "吉林大学",
  "china university of geosciences": "中国地质大学",
  "china university of petroleum": "中国石油大学",
  "university of tokyo": "东京大学",
  "kyoto university": "京都大学",
  "osaka university": "大阪大学",
  "nagoya university": "名古屋大学",
  "university of oxford": "牛津大学",
  "university of cambridge": "剑桥大学",
  "imperial college london": "帝国理工学院",
  "university college london": "伦敦大学学院",
  "university of toronto": "多伦多大学",
  "mcgill university": "麦吉尔大学",
  "university of british columbia": "不列颠哥伦比亚大学",
  "university of melbourne": "墨尔本大学",
  "university of sydney": "悉尼大学",
  "national university of singapore": "新加坡国立大学",
  "nanyang technological university": "南洋理工大学",
  "seoul national university": "首尔大学",
  "korea advanced institute of science and technology": "韩国科学技术院",
  "university of auckland": "奥克兰大学",
  "university of cape town": "开普敦大学",
  "technical university of munich": "慕尼黑工业大学",
  "ludwig maximilian university of munich": "慕尼黑大学",
  "university of bonn": "波恩大学",
  "university of hamburg": "汉堡大学",
  "university of freiburg": "弗赖堡大学",
  "university of zurich": "苏黎世大学",
  "university of geneva": "日内瓦大学",
  "university of vienna": "维也纳大学",
  "university of amsterdam": "阿姆斯特丹大学",
  "delft university of technology": "代尔夫特理工大学",
  "university of copenhagen": "哥本哈根大学",
  "university of oslo": "奥斯陆大学",
  "university of helsinki": "赫尔辛基大学",
  "university of stockholm": "斯德哥尔摩大学",
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
  "gfz helmholtz centre for geosciences": "DE",
  "gfz german research centre for geosciences": "DE",
  "helmholtz centre potsdam": "DE",
  "uppsala university": "SE",
  "university of edinburgh": "GB",
  "hokkaido university": "JP",
  "centre national de la recherche scientifique": "FR",
  "centre national de la recherche scientifique (cnrs)": "FR",
  "united states geological survey": "US",
  "karlsruhe institute of technology": "DE",
  "king fahd university of petroleum and minerals": "SA",
  "xiamen university": "CN",
  "jilin university": "CN",
  "china university of geosciences": "CN",
  "china university of petroleum": "CN",
  "university of tokyo": "JP",
  "kyoto university": "JP",
  "osaka university": "JP",
  "nagoya university": "JP",
  "university of oxford": "GB",
  "university of cambridge": "GB",
  "imperial college london": "GB",
  "university college london": "GB",
  "university of toronto": "CA",
  "mcgill university": "CA",
  "university of british columbia": "CA",
  "university of melbourne": "AU",
  "university of sydney": "AU",
  "national university of singapore": "SG",
  "nanyang technological university": "SG",
  "seoul national university": "KR",
  "korea advanced institute of science and technology": "KR",
  "university of auckland": "NZ",
  "university of cape town": "ZA",
  "technical university of munich": "DE",
  "ludwig maximilian university of munich": "DE",
  "university of bonn": "DE",
  "university of hamburg": "DE",
  "university of freiburg": "DE",
  "university of zurich": "CH",
  "university of geneva": "CH",
  "university of vienna": "AT",
  "university of amsterdam": "NL",
  "delft university of technology": "NL",
  "university of copenhagen": "DK",
  "university of oslo": "NO",
  "university of helsinki": "FI",
  "university of stockholm": "SE",
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

/** Prefer a university/college as the compact primary label for multi-affiliation authors. */
export function selectPrimaryInstitution(institutions: InstitutionRecord[]): InstitutionRecord | undefined {
  return institutions
    .map((institution, index) => ({ institution, index, score: institutionPriority(institution) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)[0]?.institution;
}

function institutionPriority(institution: InstitutionRecord): number {
  const name = institution.name.toLowerCase();
  if (institution.type === "education") return 100;
  if (/\b(university|college|school|polytechnic|institute of technology)\b/.test(name)) return 90;
  if (/\b(institute|academy)\b/.test(name)) return 55;
  if (/\b(laboratory|laboratoire|research center|research centre|observatory|station|研究所|实验室)\b/.test(name)) return 25;
  if (/\b(company|corporation|ltd|inc\.?|gmbh|aramco|bp)\b/.test(name)) return 15;
  return 40;
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
  const institution = selectPrimaryInstitution(institutions) || institutions[0];
  const flag = countryCodeToFlag(inferInstitutionCountryCode(institution));
  const first = `${flag}${flag ? " " : ""}${translateInstitutionName(institution)}`;
  return institutions.length === 1 ? first : `${first} +${institutions.length - 1}`;
}
