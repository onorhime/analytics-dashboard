import { parseISO } from 'date-fns';

/**
 * Converts various date formats to a Date object
 * Handles:
 * - Unix timestamps in seconds (10 digits)
 * - Unix timestamps in milliseconds (13 digits)
 * - ISO date strings
 * - Date objects
 */
export function parseDate(dateValue: string | number | Date | null | undefined): Date {
  if (!dateValue) {
    throw new Error('Invalid date value: null or undefined');
  }

  // If it's already a Date object, return it
  if (dateValue instanceof Date) {
    return dateValue;
  }

  // If it's a number (Unix timestamp)
  if (typeof dateValue === 'number') {
    // Check if it's in seconds (10 digits) or milliseconds (13 digits)
    // Timestamps in seconds will be less than 10000000000 (year 2286)
    if (dateValue < 10000000000) {
      // Convert seconds to milliseconds
      return new Date(dateValue * 1000);
    } else {
      // Already in milliseconds
      return new Date(dateValue);
    }
  }

  // If it's a string
  if (typeof dateValue === 'string') {
    // Check if it's a numeric string (timestamp as string)
    const numericValue = Number(dateValue);
    if (!isNaN(numericValue)) {
      return parseDate(numericValue);
    }
    
    // Otherwise, try to parse as ISO string
    try {
      return parseISO(dateValue);
    } catch {
      throw new Error(`Invalid date string: ${dateValue}`);
    }
  }

  throw new Error(`Invalid date type: ${typeof dateValue}`);
}

/**
 * Safely parses a date and returns null if invalid
 */
export function safeParseDate(dateValue: string | number | Date | null | undefined): Date | null {
  try {
    return parseDate(dateValue);
  } catch {
    return null;
  }
}