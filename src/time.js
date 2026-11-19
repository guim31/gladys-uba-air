// -----------------------------------------------------------------------------
// UBA dates: "2026-11-19 20:00:00", always in CET (UTC+1), summer included:
// the API documents CET, and on the day clocks go forward (2026-03-29) it
// still lists a 02:00 hour, which does not exist in CEST. So the offset is a
// constant here, and no time zone database is needed in the image (the
// container runs in the time zone of Gladys, TZ, which may be another one).
// -----------------------------------------------------------------------------

const HOUR_MS = 3_600_000;

/**
 * A UBA date as epoch milliseconds, or null when it is not one.
 * "24:00:00" is accepted (midnight of the next day).
 * @param {unknown} text
 * @returns {number|null}
 */
export function parseCetTime(text) {
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
    String(text ?? '').trim(),
  );
  if (!match) {
    return null;
  }
  const [year, month, day, hour, minute, second] = match.slice(1).map((part) => Number(part ?? 0));
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 24 || minute > 59) {
    return null;
  }
  return Date.UTC(year, month - 1, day, hour, minute, second) - HOUR_MS;
}

/** The CET calendar day of an instant, "YYYY-MM-DD" (the API's date parameters). */
export function cetDate(ms) {
  return new Date(ms + HOUR_MS).toISOString().slice(0, 10);
}
