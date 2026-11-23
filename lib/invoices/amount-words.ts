/**
 * Formats a currency amount into Indian English words.
 * Handles Rupees and Paise, Thousands, Lakhs, Crores, Zero, and decimal rounding.
 *
 * Example: 10000 -> "INR Ten Thousand Rupees Only"
 * Example: 123456.75 -> "INR One Lakh Twenty Three Thousand Four Hundred Fifty Six Rupees and Seventy Five Paise Only"
 * Example: 0 -> "INR Zero Rupees Only"
 */

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function convertGroupUnderThousand(n: number): string {
  let str = "";
  if (n >= 100) {
    str += ONES[Math.floor(n / 100)] + " Hundred";
    n %= 100;
    if (n > 0) str += " ";
  }
  if (n >= 20) {
    str += TENS[Math.floor(n / 10)];
    const rem = n % 10;
    if (rem > 0) str += " " + ONES[rem];
  } else if (n > 0) {
    str += ONES[n];
  }
  return str.trim();
}

/**
 * Converts an integer number into Indian currency words.
 * Indian format: Crores (10,000,000), Lakhs (100,000), Thousands (1,000), Hundreds (100).
 */
export function integerToIndianWords(num: number): string {
  if (num === 0) return "Zero";
  if (num < 0) return "Minus " + integerToIndianWords(Math.abs(num));

  const parts: string[] = [];

  // Crores (>= 1,00,00,000)
  if (num >= 10000000) {
    const crores = Math.floor(num / 10000000);
    parts.push(integerToIndianWords(crores) + " Crore");
    num %= 10000000;
  }

  // Lakhs (>= 1,00,000)
  if (num >= 100000) {
    const lakhs = Math.floor(num / 100000);
    parts.push(convertGroupUnderThousand(lakhs) + " Lakh");
    num %= 100000;
  }

  // Thousands (>= 1,000)
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    parts.push(convertGroupUnderThousand(thousands) + " Thousand");
    num %= 1000;
  }

  // Hundreds & remainder (< 1,000)
  if (num > 0) {
    parts.push(convertGroupUnderThousand(num));
  }

  return parts.filter(Boolean).join(" ");
}

/**
 * Formats a monetary amount into full Indian currency words:
 * "INR [Words] Rupees [and [Words] Paise] Only"
 */
export function amountInWords(amount: number, currency: string = "INR"): string {
  const rounded = Math.round((Number(amount) || 0) * 100) / 100;
  if (rounded === 0) {
    return `${currency} Zero Rupees Only`;
  }

  const isNegative = rounded < 0;
  const absAmount = Math.abs(rounded);
  const rupees = Math.floor(absAmount);
  const paise = Math.round((absAmount - rupees) * 100);

  let result = integerToIndianWords(rupees);
  if (rupees === 1) {
    result += " Rupee";
  } else {
    result += " Rupees";
  }

  if (paise > 0) {
    result += " and " + convertGroupUnderThousand(paise) + " Paise";
  }

  result += " Only";

  return `${isNegative ? "Minus " : ""}${currency} ${result}`;
}
