import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | null | undefined): string {
  const numeric = typeof amount === "string" ? parseFloat(amount) : amount;
  if (numeric === null || numeric === undefined || isNaN(numeric)) {
    return "₹0.00";
  }

  // Format using Indian numbering system
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);
}

export function formatDate(date: string | Date | null | undefined, pattern: string = "dd MMM yyyy"): string {
  if (!date) return "-";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return format(d, pattern);
  } catch {
    return "-";
  }
}

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];

const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
];

function convertTwoDigits(num: number): string {
  if (num < 20) return ONES[num];
  const ten = Math.floor(num / 10);
  const one = num % 10;
  return TENS[ten] + (one !== 0 ? " " + ONES[one] : "");
}

function convertThreeDigits(num: number): string {
  const hundred = Math.floor(num / 100);
  const rest = num % 100;
  let str = "";
  if (hundred > 0) {
    str += ONES[hundred] + " Hundred";
    if (rest > 0) str += " and ";
  }
  if (rest > 0) {
    str += convertTwoDigits(rest);
  }
  return str.trim();
}

/**
 * Converts a numeric amount to Indian Rupee Words (Lakhs & Crores)
 * e.g. 154250.50 -> "One Lakh Fifty Four Thousand Two Hundred Fifty Rupees and Fifty Paise Only"
 */
export function numberToWordsINR(amount: number | string | null | undefined): string {
  const numeric = typeof amount === "string" ? parseFloat(amount) : amount;
  if (!numeric || isNaN(numeric) || numeric === 0) {
    return "Zero Rupees Only";
  }

  const absolute = Math.abs(numeric);
  const rupees = Math.floor(absolute);
  const paise = Math.round((absolute - rupees) * 100);

  let result = "";

  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const hundredPart = rupees % 1000;

  if (crore > 0) {
    result += convertThreeDigits(crore) + " Crore ";
  }
  if (lakh > 0) {
    result += convertTwoDigits(lakh) + " Lakh ";
  }
  if (thousand > 0) {
    result += convertTwoDigits(thousand) + " Thousand ";
  }
  if (hundredPart > 0) {
    result += convertThreeDigits(hundredPart) + " ";
  }

  result = result.trim() + " Rupees";

  if (paise > 0) {
    result += " and " + convertTwoDigits(paise) + " Paise";
  }

  return result.trim() + " Only";
}
