import { useState, useEffect } from 'react';

/**
 * Formats any date string (ISO 'YYYY-MM-DD', 'YYYY-MM-DDTHH:mm:ssZ', etc.) or Date object
 * into the required MM/DD/YYYY format.
 */
export function formatDateMMDDYYYY(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '—';

  try {
    let dateObj: Date;

    if (typeof dateInput === 'string') {
      // If already in YYYY-MM-DD format, parse parts directly to avoid UTC timezone offset shifts
      const ymdMatch = dateInput.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (ymdMatch) {
        const year = ymdMatch[1];
        const month = ymdMatch[2].padStart(2, '0');
        const day = ymdMatch[3].padStart(2, '0');
        return `${month}/${day}/${year}`;
      }
      dateObj = new Date(dateInput);
    } else {
      dateObj = dateInput;
    }

    if (isNaN(dateObj.getTime())) {
      return String(dateInput);
    }

    // Format in UTC+7 (Asia/Jakarta / WIB) to ensure consistent date display
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta',
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });

    return formatter.format(dateObj); // returns MM/DD/YYYY
  } catch (err) {
    return String(dateInput);
  }
}

/**
 * Returns the current date and time in Waktu Indonesia Barat (WIB, UTC+7)
 * formatted as "MM/DD/YYYY HH:mm:ss WIB"
 */
export function formatWibDateTime(date: Date = new Date()): {
  dateStr: string; // MM/DD/YYYY
  timeStr: string; // HH:mm:ss WIB
  fullStr: string; // MM/DD/YYYY HH:mm:ss WIB
  hoursMinutesStr: string; // HH:mm WIB
} {
  try {
    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta',
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });

    const timeFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const hmFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const dateStr = dateFormatter.format(date); // MM/DD/YYYY
    const timeStr = `${timeFormatter.format(date)} WIB`;
    const hoursMinutesStr = `${hmFormatter.format(date)} WIB`;
    const fullStr = `${dateStr} ${timeStr}`;

    return {
      dateStr,
      timeStr,
      fullStr,
      hoursMinutesStr,
    };
  } catch (err) {
    // Fallback if timeZone is not supported
    const d = new Date(date.getTime() + (7 * 60 + date.getTimezoneOffset()) * 60000);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');

    const dateStr = `${mm}/${dd}/${yyyy}`;
    const timeStr = `${hh}:${min}:${ss} WIB`;
    return {
      dateStr,
      timeStr,
      fullStr: `${dateStr} ${timeStr}`,
      hoursMinutesStr: `${hh}:${min} WIB`,
    };
  }
}

/**
 * Custom hook that updates every second to give a live WIB clock
 */
export function useLiveWibClock() {
  const [clock, setClock] = useState(() => formatWibDateTime(new Date()));

  useEffect(() => {
    const timer = setInterval(() => {
      setClock(formatWibDateTime(new Date()));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return clock;
}
