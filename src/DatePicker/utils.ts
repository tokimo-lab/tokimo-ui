import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

export function formatDate(date: Date, format: string): string {
  return dayjs(date).format(format);
}

export function parseDate(str: string, format: string): Date | null {
  const parsed = dayjs(str, format, true);
  return parsed.isValid() ? parsed.toDate() : null;
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
