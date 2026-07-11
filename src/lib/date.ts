/** Format a Date as a local `YYYY-MM-DD` string (backend `from`/`to` query params are date-only). */
export function toDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function addDays(date: Date, delta: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + delta);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

/** Groups a record's `recordedAt` into 今天/昨天/實際日期 label per the issue #7 table spec. */
export function formatGroupLabel(recordedAt: string): string {
  const date = new Date(recordedAt);
  const today = new Date();
  const yesterday = addDays(today, -1);

  if (isSameDay(date, today)) return '今天';
  if (isSameDay(date, yesterday)) return '昨天';

  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

export function formatTime(dateTimeString: string): string {
  const date = new Date(dateTimeString);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** Converts an ISO datetime string to the local `YYYY-MM-DDTHH:mm` value a `datetime-local` input expects. */
export function toDateTimeLocalValue(dateTimeString: string): string {
  const date = new Date(dateTimeString);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

/** Converts a `datetime-local` input's local value back to a UTC ISO string for the API. */
export function fromDateTimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}
