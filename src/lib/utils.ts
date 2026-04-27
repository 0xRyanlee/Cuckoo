import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseSafeFloat(val: string): number | null {
  if (!val || val.trim() === "") return null;
  const parsed = parseFloat(val);
  if (isNaN(parsed)) return null;
  return parsed;
}
