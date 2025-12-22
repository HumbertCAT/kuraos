/**
 * Datetime utilities for timezone-aware formatting.
 * 
 * Follows the UTC Sandwich pattern:
 * - All dates from API are in UTC (ISO 8601 with Z suffix)
 * - Convert to local timezone only when displaying to user
 * - Send user's timezone when creating bookings for DST protection
 */

/**
 * Get the user's IANA timezone string (e.g., "Europe/Madrid", "America/Mexico_City")
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Format a UTC datetime string to local time for display
 * 
 * @param utcString - ISO 8601 datetime string (e.g., "2025-01-15T10:00:00Z")
 * @param locale - Locale for formatting (default: browser locale)
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted local datetime string
 * 
 * @example
 * formatLocalDateTime("2025-01-15T10:00:00Z") 
 * // → "15 ene 2025, 11:00" (if user is in Europe/Madrid, +1 hour)
 */
export function formatLocalDateTime(
  utcString: string,
  locale?: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = new Date(utcString);
  const userLocale = locale || navigator.language || 'es-ES';
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: getUserTimezone(),
  };

  return new Intl.DateTimeFormat(userLocale, { ...defaultOptions, ...options }).format(date);
}

/**
 * Format a UTC datetime to show only the date in local timezone
 */
export function formatLocalDate(utcString: string, locale?: string): string {
  const date = new Date(utcString);
  const userLocale = locale || navigator.language || 'es-ES';
  
  return new Intl.DateTimeFormat(userLocale, {
    dateStyle: 'long',
    timeZone: getUserTimezone(),
  }).format(date);
}

/**
 * Format a UTC datetime to show only the time in local timezone
 */
export function formatLocalTime(utcString: string, locale?: string): string {
  const date = new Date(utcString);
  const userLocale = locale || navigator.language || 'es-ES';
  
  return new Intl.DateTimeFormat(userLocale, {
    timeStyle: 'short',
    timeZone: getUserTimezone(),
  }).format(date);
}

/**
 * Convert a local Date object to ISO string with timezone offset
 * Use this when sending datetimes to the API
 * 
 * @example
 * toISOWithTimezone(new Date())
 * // → "2025-01-15T11:00:00+01:00"
 */
export function toISOWithTimezone(date: Date): string {
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
  const minutes = String(Math.abs(offset) % 60).padStart(2, '0');
  
  const localISO = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, -1); // Remove trailing 'Z'
  
  return `${localISO}${sign}${hours}:${minutes}`;
}

/**
 * Format datetime with explicit timezone label
 * Useful for displaying booking times clearly
 * 
 * @example
 * formatWithTimezoneLabel("2025-01-15T10:00:00Z")
 * // → "15 ene 2025, 11:00 (Tu hora local)"
 */
export function formatWithTimezoneLabel(
  utcString: string,
  label: string = 'Tu hora local',
  locale?: string
): string {
  const formatted = formatLocalDateTime(utcString, locale);
  return `${formatted} (${label})`;
}

/**
 * Get relative time description (e.g., "in 2 hours", "tomorrow")
 */
export function getRelativeTime(utcString: string, locale?: string): string {
  const date = new Date(utcString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  const userLocale = locale || navigator.language || 'es-ES';
  const rtf = new Intl.RelativeTimeFormat(userLocale, { numeric: 'auto' });
  
  if (Math.abs(diffDays) >= 1) {
    return rtf.format(diffDays, 'day');
  }
  return rtf.format(diffHours, 'hour');
}
