import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useLocale } from "../locale";
import { cn } from "../utils";
import { type CalendarDay, generateCalendarDays, isSameDay } from "./utils";

type ViewMode = "day" | "month" | "year";

interface CalendarPanelProps {
  value?: Date | null;
  onSelect: (date: Date) => void;
  disabledDate?: (date: Date) => boolean;
  onToday?: () => void;
  showToday?: boolean;
}

export function CalendarPanel({
  value,
  onSelect,
  disabledDate,
  onToday,
  showToday = true,
}: CalendarPanelProps) {
  const locale = useLocale().DatePicker;
  const now = new Date();
  const initYear = value?.getFullYear() ?? now.getFullYear();
  const initMonth = value?.getMonth() ?? now.getMonth();

  const [viewYear, setViewYear] = useState(initYear);
  const [viewMonth, setViewMonth] = useState(initMonth);
  const [viewMode, setViewMode] = useState<ViewMode>("day");

  const decadeStart = Math.floor(viewYear / 10) * 10;

  const days = useMemo(
    () => generateCalendarDays(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handlePrevYear = () => setViewYear(viewYear - 1);
  const handleNextYear = () => setViewYear(viewYear + 1);
  const handlePrevDecade = () => setViewYear(viewYear - 10);
  const handleNextDecade = () => setViewYear(viewYear + 10);

  const handleDaySelect = (day: CalendarDay) => {
    if (disabledDate?.(day.date)) return;
    if (!day.isCurrentMonth) {
      setViewYear(day.date.getFullYear());
      setViewMonth(day.date.getMonth());
    }
    onSelect(day.date);
  };

  const handleMonthSelect = (month: number) => {
    setViewMonth(month);
    setViewMode("day");
  };

  const handleYearSelect = (year: number) => {
    setViewYear(year);
    setViewMode("month");
  };

  const handleToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    if (onToday) {
      onToday();
    } else {
      onSelect(today);
    }
  };

  const renderHeader = () => {
    if (viewMode === "day") {
      return (
        <div className="flex items-center justify-between px-2 py-1.5">
          <div className="flex items-center gap-0.5">
            <NavBtn onClick={handlePrevYear}>
              <ChevronsLeft className="h-3.5 w-3.5" />
            </NavBtn>
            <NavBtn onClick={handlePrevMonth}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </NavBtn>
          </div>
          <div className="flex items-center gap-1 text-sm font-medium">
            <button
              type="button"
              className="cursor-pointer hover:text-[var(--accent)] transition-colors px-1"
              onClick={() => setViewMode("year")}
            >
              {locale.formatYear(viewYear)}
            </button>
            <button
              type="button"
              className="cursor-pointer hover:text-[var(--accent)] transition-colors px-1"
              onClick={() => setViewMode("month")}
            >
              {locale.formatMonth(viewMonth + 1)}
            </button>
          </div>
          <div className="flex items-center gap-0.5">
            <NavBtn onClick={handleNextMonth}>
              <ChevronRight className="h-3.5 w-3.5" />
            </NavBtn>
            <NavBtn onClick={handleNextYear}>
              <ChevronsRight className="h-3.5 w-3.5" />
            </NavBtn>
          </div>
        </div>
      );
    }

    if (viewMode === "month") {
      return (
        <div className="flex items-center justify-between px-2 py-1.5">
          <NavBtn onClick={handlePrevYear}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </NavBtn>
          <button
            type="button"
            className="text-sm font-medium cursor-pointer hover:text-[var(--accent)] transition-colors px-1"
            onClick={() => setViewMode("year")}
          >
            {locale.formatYear(viewYear)}
          </button>
          <NavBtn onClick={handleNextYear}>
            <ChevronRight className="h-3.5 w-3.5" />
          </NavBtn>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between px-2 py-1.5">
        <NavBtn onClick={handlePrevDecade}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </NavBtn>
        <span className="text-sm font-medium">
          {decadeStart} – {decadeStart + 9}
        </span>
        <NavBtn onClick={handleNextDecade}>
          <ChevronRight className="h-3.5 w-3.5" />
        </NavBtn>
      </div>
    );
  };

  const renderDayView = () => (
    <div className="px-2 pb-1">
      <div className="grid grid-cols-7 mb-0.5">
        {locale.weekDays.map((d) => (
          <div
            key={d}
            className="text-center text-xs text-[var(--text-muted)] py-1"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const isSelected = value ? isSameDay(day.date, value) : false;
          const isDisabled = disabledDate?.(day.date) ?? false;
          const key = `${day.date.getFullYear()}-${day.date.getMonth()}-${day.day}`;
          return (
            <button
              key={key}
              type="button"
              disabled={isDisabled}
              className={cn(
                "h-7 w-full text-xs rounded cursor-pointer transition-colors relative",
                day.isCurrentMonth
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-muted)]",
                isSelected
                  ? "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
                  : "hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
                day.isToday &&
                  !isSelected &&
                  "text-[var(--accent)] font-semibold",
                isDisabled && "opacity-30 !cursor-not-allowed",
              )}
              onClick={() => handleDaySelect(day)}
            >
              {day.day}
              {day.isToday && !isSelected ? (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--accent)]" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderMonthView = () => (
    <div className="grid grid-cols-3 gap-2 px-3 py-2">
      {locale.monthNamesShort.map((name, i) => {
        const isCurrent =
          viewYear === now.getFullYear() && i === now.getMonth();
        const isSelected =
          value && viewYear === value.getFullYear() && i === value.getMonth();
        return (
          <button
            key={name}
            type="button"
            className={cn(
              "py-2 text-sm rounded cursor-pointer transition-colors",
              isSelected
                ? "bg-[var(--accent)] text-white"
                : "hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
              isCurrent && !isSelected && "text-[var(--accent)] font-semibold",
            )}
            onClick={() => handleMonthSelect(i)}
          >
            {name}
          </button>
        );
      })}
    </div>
  );

  const renderYearView = () => {
    const years: number[] = [];
    for (let y = decadeStart - 1; y <= decadeStart + 10; y++) {
      years.push(y);
    }
    return (
      <div className="grid grid-cols-3 gap-2 px-3 py-2">
        {years.map((y) => {
          const isInDecade = y >= decadeStart && y <= decadeStart + 9;
          const isCurrent = y === now.getFullYear();
          const isSelected = value && y === value.getFullYear();
          return (
            <button
              key={y}
              type="button"
              className={cn(
                "py-2 text-sm rounded cursor-pointer transition-colors",
                !isInDecade && "text-[var(--text-muted)]",
                isSelected
                  ? "bg-[var(--accent)] text-white"
                  : "hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
                isCurrent &&
                  !isSelected &&
                  "text-[var(--accent)] font-semibold",
              )}
              onClick={() => handleYearSelect(y)}
            >
              {y}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-[280px]">
      {renderHeader()}
      <div className="border-t border-black/[0.06] dark:border-white/[0.08]">
        {viewMode === "day"
          ? renderDayView()
          : viewMode === "month"
            ? renderMonthView()
            : renderYearView()}
      </div>
      {showToday && viewMode === "day" ? (
        <div className="border-t border-black/[0.06] dark:border-white/[0.08] px-3 py-1.5 text-center">
          <button
            type="button"
            className="text-xs text-[var(--accent)] cursor-pointer hover:text-[var(--accent-hover)] transition-colors"
            onClick={handleToday}
          >
            {locale.today}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function NavBtn({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="p-1 rounded cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
