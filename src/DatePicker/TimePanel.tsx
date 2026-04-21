import { useEffect, useRef } from "react";
import { useLocale } from "../locale";
import type { ScrollAreaRef } from "../ScrollArea";
import { ScrollArea } from "../ScrollArea";
import { cn } from "../utils";

interface TimePanelProps {
  value?: Date | null;
  onChange: (date: Date) => void;
  showSecond?: boolean;
  hourStep?: number;
  minuteStep?: number;
  secondStep?: number;
  onNow?: () => void;
  onOk?: () => void;
  showNow?: boolean;
  showOk?: boolean;
}

export function TimePanel({
  value,
  onChange,
  showSecond = true,
  hourStep = 1,
  minuteStep = 1,
  secondStep = 1,
  onNow,
  onOk,
  showNow = true,
  showOk = true,
}: TimePanelProps) {
  const locale = useLocale().DatePicker;
  const hour = value?.getHours() ?? 0;
  const minute = value?.getMinutes() ?? 0;
  const second = value?.getSeconds() ?? 0;

  const hours = Array.from(
    { length: Math.ceil(24 / hourStep) },
    (_, i) => i * hourStep,
  );
  const minutes = Array.from(
    { length: Math.ceil(60 / minuteStep) },
    (_, i) => i * minuteStep,
  );
  const seconds = Array.from(
    { length: Math.ceil(60 / secondStep) },
    (_, i) => i * secondStep,
  );

  const handleSelect = (unit: "hour" | "minute" | "second", v: number) => {
    const d = value ? new Date(value) : new Date();
    if (unit === "hour") d.setHours(v);
    else if (unit === "minute") d.setMinutes(v);
    else d.setSeconds(v);
    onChange(d);
  };

  return (
    <div>
      <div className={cn("flex", showSecond ? "w-[168px]" : "w-[112px]")}>
        <TimeColumn
          items={hours}
          selected={hour}
          onSelect={(v) => handleSelect("hour", v)}
        />
        <TimeColumn
          items={minutes}
          selected={minute}
          onSelect={(v) => handleSelect("minute", v)}
        />
        {showSecond ? (
          <TimeColumn
            items={seconds}
            selected={second}
            onSelect={(v) => handleSelect("second", v)}
          />
        ) : null}
      </div>
      {showNow || showOk ? (
        <div className="flex items-center justify-between border-t border-black/[0.06] dark:border-white/[0.08] px-3 py-1.5">
          {showNow ? (
            <button
              type="button"
              className="text-xs text-[var(--accent)] cursor-pointer hover:text-[var(--accent-hover)] transition-colors"
              onClick={onNow}
            >
              {locale.now}
            </button>
          ) : (
            <span />
          )}
          {showOk ? (
            <button
              type="button"
              className="text-xs px-3 py-0.5 rounded bg-[var(--accent)] text-white cursor-pointer hover:bg-[var(--accent-hover)] transition-colors"
              onClick={onOk}
            >
              {locale.ok}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function TimeColumn({
  items,
  selected,
  onSelect,
}: {
  items: number[];
  selected: number;
  onSelect: (v: number) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<ScrollAreaRef>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (selectedRef.current && wrapperRef.current && scrollAreaRef.current) {
      const container = wrapperRef.current;
      const item = selectedRef.current;
      const scrollTop =
        item.offsetTop - container.clientHeight / 2 + item.clientHeight / 2;
      scrollAreaRef.current.scrollTo(0, scrollTop);
    }
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="h-[224px] flex-1 border-r border-black/[0.06] dark:border-white/[0.08] last:border-r-0"
    >
      <ScrollArea
        ref={scrollAreaRef}
        direction="vertical"
        className="h-full"
        innerClassName="w-full"
      >
        {items.map((v) => {
          const isSelected = v === selected;
          return (
            <button
              key={v}
              ref={isSelected ? selectedRef : undefined}
              type="button"
              className={cn(
                "w-full h-7 text-xs text-center cursor-pointer transition-colors",
                isSelected
                  ? "bg-[var(--accent-subtle)] text-[var(--accent)] font-medium"
                  : "text-[var(--text-primary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
              )}
              onClick={() => onSelect(v)}
            >
              {String(v).padStart(2, "0")}
            </button>
          );
        })}
      </ScrollArea>
    </div>
  );
}
