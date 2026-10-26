/**
 * A number of ads in Arabic: "إعلان واحد", "إعلانان", "9 إعلانات", "72 إعلان".
 * Counts ending in 3 to 10 take the plural ("103 إعلانات"); the rest take the singular.
 */
export function adsCountAr(count: number): string {
  const n = Math.round(count);
  if (n === 1) return "إعلان واحد";
  if (n === 2) return "إعلانان";
  const tail = n % 100;
  return `${n.toLocaleString("en-US")} ${tail >= 3 && tail <= 10 ? "إعلانات" : "إعلان"}`;
}
