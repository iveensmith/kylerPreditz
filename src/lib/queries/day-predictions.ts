/** The next date (today counts) that falls on the given UTC weekday (0=Sunday..6=Saturday). */
export function nextOccurrenceOfWeekday(targetWeekday: number, from = new Date()): Date {
  const today = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const diff = (targetWeekday - today.getUTCDay() + 7) % 7;
  return new Date(today.getTime() + diff * 24 * 60 * 60 * 1000);
}
