import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | undefined): string {
  if (!date) return "N/A";
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) return "Invalid date";
  
  // Format the date as a locale string (e.g., "Mar 15, 2023")
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export interface SyncSettings {
  fields?: string | string[] | null;
  tenderActivityId?: number | null;
  pageSize?: number | null;
  tenderCategory?: number | null;
  tenderAreasIdString?: number | null;
}
