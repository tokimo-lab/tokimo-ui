export function formatDate(date: Date, format: string): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const h = date.getHours();
  const min = date.getMinutes();
  const s = date.getSeconds();
  return format
    .replace("YYYY", String(y))
    .replace("MM", String(m).padStart(2, "0"))
    .replace("DD", String(d).padStart(2, "0"))
    .replace("HH", String(h).padStart(2, "0"))
    .replace("mm", String(min).padStart(2, "0"))
    .replace("ss", String(s).padStart(2, "0"));
}

export function parseDate(str: string, format: string): Date | null {
  const yIdx = format.indexOf("YYYY");
  const mIdx = format.indexOf("MM");
  const dIdx = format.indexOf("DD");
  const hIdx = format.indexOf("HH");
  const minIdx = format.indexOf("mm");
  const sIdx = format.indexOf("ss");

  const extract = (idx: number, len: number) =>
    idx >= 0 && idx + len <= str.length
      ? Number.parseInt(str.slice(idx, idx + len), 10)
      : 0;

  const y = yIdx >= 0 ? extract(yIdx, 4) : new Date().getFullYear();
  const m = mIdx >= 0 ? extract(mIdx, 2) - 1 : 0;
  const d = dIdx >= 0 ? extract(dIdx, 2) : 1;
  const h = hIdx >= 0 ? extract(hIdx, 2) : 0;
  const min = minIdx >= 0 ? extract(minIdx, 2) : 0;
  const s = sIdx >= 0 ? extract(sIdx, 2) : 0;

  if ([y, m + 1, d, h, min, s].some(Number.isNaN)) return null;
  if (h < 0 || h > 23 || min < 0 || min > 59 || s < 0 || s > 59) return null;

  const date = new Date(y, m, d, h, min, s);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

export interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export function generateCalendarDays(
  year: number,
  month: number,
): CalendarDay[] {
  const now = new Date();
  const todayY = now.getFullYear();
  const todayM = now.getMonth();
  const todayD = now.getDate();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days: CalendarDay[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const date = new Date(year, month - 1, d);
    days.push({
      date,
      day: d,
      isCurrentMonth: false,
      isToday:
        date.getFullYear() === todayY &&
        date.getMonth() === todayM &&
        date.getDate() === todayD,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    days.push({
      date,
      day: d,
      isCurrentMonth: true,
      isToday: year === todayY && month === todayM && d === todayD,
    });
  }

  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(year, month + 1, d);
    days.push({
      date,
      day: d,
      isCurrentMonth: false,
      isToday:
        date.getFullYear() === todayY &&
        date.getMonth() === todayM &&
        date.getDate() === todayD,
    });
  }

  return days;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
