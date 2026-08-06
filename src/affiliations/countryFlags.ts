/** Convert an ISO 3166-1 alpha-2 code to an emoji flag. */
export function countryCodeToFlag(countryCode?: string): string {
  const code = String(countryCode || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "";
  return String.fromCodePoint(...[...code].map((letter) => 127397 + letter.charCodeAt(0)));
}
