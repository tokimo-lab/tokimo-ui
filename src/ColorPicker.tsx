import {
  autoUpdate,
  FloatingPortal,
  flip,
  offset,
  type Placement,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import { Pipette } from "lucide-react";
import {
  type CSSProperties,
  type ReactElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { FloatingVibrancy } from "./FloatingVibrancy";
import { cn } from "./utils";

/* ─── Types ─── */

export interface ColorPickerProps {
  /** Current color value (hex string, e.g. "#ff0000") */
  value?: string;
  /** Callback when color changes */
  onChange?: (color: string) => void;
  /** Placeholder when no color selected */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Trigger size variant */
  size?: "small" | "middle" | "large";
  /** Popover placement */
  placement?: Placement;
  /** Whether to show the hex text input */
  showInput?: boolean;
  /** Preset color swatches */
  presets?: string[];
  /** Custom CSS class for the trigger */
  className?: string;
  /** Custom CSS class for the popover panel */
  popupClassName?: string;
  /** Custom trigger element — receives current color and open state */
  children?: ReactElement;
}

/* ─── Constants ─── */

const DEFAULT_PRESETS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#78716c",
  "#64748b",
  "#1e293b",
];

const SWATCH_SIZE_MAP = {
  small: "h-6 w-6",
  middle: "h-8 w-8",
  large: "h-10 w-10",
} as const;

/* ─── Helpers ─── */

function isValidHex(hex: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(hex);
}

function normalizeHex(input: string): string {
  const v = input.startsWith("#") ? input : `#${input}`;
  // Expand 3-char shorthand: #abc → #aabbcc
  if (/^#[0-9a-f]{3}$/i.test(v)) {
    return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  }
  return v;
}

/** Convert hex to HSV (h: 0-360, s: 0-1, v: 0-1) */
function hexToHsv(hex: string): [number, number, number] {
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + 6) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  const s = max === 0 ? 0 : d / max;
  return [h, s, max];
}

/** Convert HSV to hex */
function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/* ─── Saturation/Value Panel ─── */

function SaturationPanel({
  hue,
  saturation,
  brightness,
  onChange,
}: {
  hue: number;
  saturation: number;
  brightness: number;
  onChange: (s: number, v: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const pick = useCallback(
    (clientX: number, clientY: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const s = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const v = Math.max(
        0,
        Math.min(1, 1 - (clientY - rect.top) / rect.height),
      );
      onChange(s, v);
    },
    [onChange],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      pick(e.clientX, e.clientY);
    },
    [pick],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragging.current) pick(e.clientX, e.clientY);
    },
    [pick],
  );

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const pureColor = hsvToHex(hue, 1, 1);

  return (
    <div
      ref={containerRef}
      className="relative h-[150px] w-full cursor-crosshair rounded-lg select-none"
      style={{ backgroundColor: pureColor }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* White gradient left→right */}
      <div
        className="absolute inset-0 rounded-lg"
        style={{
          background: "linear-gradient(to right, #fff, transparent)",
        }}
      />
      {/* Black gradient top→bottom */}
      <div
        className="absolute inset-0 rounded-lg"
        style={{
          background: "linear-gradient(to bottom, transparent, #000)",
        }}
      />
      {/* Thumb */}
      <div
        className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.2),0_2px_4px_rgba(0,0,0,0.3)]"
        style={{
          left: `${saturation * 100}%`,
          top: `${(1 - brightness) * 100}%`,
        }}
      />
    </div>
  );
}

/* ─── Hue Slider ─── */

function HueSlider({
  hue,
  onChange,
}: {
  hue: number;
  onChange: (hue: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const pick = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const ratio = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width),
      );
      onChange(ratio * 360);
    },
    [onChange],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      pick(e.clientX);
    },
    [pick],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragging.current) pick(e.clientX);
    },
    [pick],
  );

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return (
    <div
      ref={trackRef}
      className="relative h-3 w-full cursor-pointer rounded-full select-none"
      style={{
        background:
          "linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div
        className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.15),0_1px_3px_rgba(0,0,0,0.3)]"
        style={{
          left: `${(hue / 360) * 100}%`,
          backgroundColor: hsvToHex(hue, 1, 1),
        }}
      />
    </div>
  );
}

/* ─── Preset Swatches ─── */

function PresetSwatches({
  presets,
  value,
  onChange,
}: {
  presets: string[];
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {presets.map((color) => (
        <button
          key={color}
          type="button"
          className={cn(
            "h-5 w-5 cursor-pointer rounded-md transition-all hover:scale-110",
            value.toLowerCase() === color.toLowerCase()
              ? "ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[var(--bg-elevated)]"
              : "ring-1 ring-black/[0.08] dark:ring-white/[0.1]",
          )}
          style={{ backgroundColor: color }}
          onClick={() => onChange(color)}
          title={color}
        />
      ))}
    </div>
  );
}

/* ─── Hex Input ─── */

function HexInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  const [localValue, setLocalValue] = useState(value);

  // Sync from parent when value changes externally
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setLocalValue(raw);
      const hex = normalizeHex(raw);
      if (isValidHex(hex)) {
        onChange(hex);
      }
    },
    [onChange],
  );

  const handleBlur = useCallback(() => {
    const hex = normalizeHex(localValue);
    if (isValidHex(hex)) {
      setLocalValue(hex);
      onChange(hex);
    } else {
      // Revert to last valid value
      setLocalValue(value);
    }
  }, [localValue, value, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      (e.target as HTMLInputElement).blur();
    }
  }, []);

  return (
    <div className="flex items-center gap-2">
      <div
        className="h-8 w-8 shrink-0 rounded-lg border border-black/[0.08] dark:border-white/[0.1]"
        style={{ backgroundColor: value }}
      />
      <div className="relative flex-1">
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">
          #
        </span>
        <input
          type="text"
          value={localValue.replace(/^#/, "")}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="000000"
          maxLength={6}
          spellCheck={false}
          className="h-8 w-full rounded-lg border border-black/[0.08] bg-[var(--input-bg)] pl-6 pr-2.5 font-mono text-xs text-[var(--text-primary)] uppercase outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] dark:border-white/[0.1]"
        />
      </div>
    </div>
  );
}

/* ─── EyeDropper support ─── */

function useEyeDropper() {
  const [supported] = useState(
    () => typeof window !== "undefined" && "EyeDropper" in window,
  );
  return supported;
}

/* ─── Picker Panel (inner content) ─── */

function ColorPickerPanel({
  value,
  onChange,
  presets,
  showInput,
}: {
  value: string;
  onChange: (color: string) => void;
  presets?: string[];
  showInput: boolean;
}) {
  const hex = isValidHex(value) ? value : "#000000";
  const [h, s, v] = hexToHsv(hex);
  const [hue, setHue] = useState(h);
  const [sat, setSat] = useState(s);
  const [bright, setBright] = useState(v);
  const eyeDropperSupported = useEyeDropper();

  // Sync internal HSV when value changes externally
  const prevHex = useRef(hex);
  useLayoutEffect(() => {
    if (hex !== prevHex.current) {
      const [nh, ns, nv] = hexToHsv(hex);
      setHue(nh);
      setSat(ns);
      setBright(nv);
      prevHex.current = hex;
    }
  }, [hex]);

  const emitColor = useCallback(
    (newH: number, newS: number, newV: number) => {
      const newHex = hsvToHex(newH, newS, newV);
      prevHex.current = newHex;
      onChange(newHex);
    },
    [onChange],
  );

  const handleSatBright = useCallback(
    (newS: number, newV: number) => {
      setSat(newS);
      setBright(newV);
      emitColor(hue, newS, newV);
    },
    [hue, emitColor],
  );

  const handleHue = useCallback(
    (newH: number) => {
      setHue(newH);
      emitColor(newH, sat, bright);
    },
    [sat, bright, emitColor],
  );

  const handleHexInput = useCallback(
    (newHex: string) => {
      const [nh, ns, nv] = hexToHsv(newHex);
      setHue(nh);
      setSat(ns);
      setBright(nv);
      prevHex.current = newHex;
      onChange(newHex);
    },
    [onChange],
  );

  const handlePresetSelect = useCallback(
    (color: string) => {
      const [nh, ns, nv] = hexToHsv(color);
      setHue(nh);
      setSat(ns);
      setBright(nv);
      prevHex.current = color;
      onChange(color);
    },
    [onChange],
  );

  const handleEyeDropper = useCallback(async () => {
    const ac = new AbortController();
    // Abort the eye dropper on right-click so only left-click applies
    const onContext = (e: Event) => {
      e.preventDefault();
      ac.abort();
    };
    window.addEventListener("contextmenu", onContext, { signal: ac.signal });
    try {
      // @ts-expect-error EyeDropper API not in all TS libs
      const dropper = new EyeDropper();
      const result = await dropper.open({ signal: ac.signal });
      const picked = result.sRGBHex as string;
      if (isValidHex(picked)) {
        handlePresetSelect(picked);
      }
    } catch {
      // User cancelled, right-clicked, or API error — ignore
    } finally {
      ac.abort();
    }
  }, [handlePresetSelect]);

  const currentHex = hsvToHex(hue, sat, bright);

  return (
    <div className="flex w-[240px] flex-col gap-3 p-3">
      <SaturationPanel
        hue={hue}
        saturation={sat}
        brightness={bright}
        onChange={handleSatBright}
      />
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <HueSlider hue={hue} onChange={handleHue} />
        </div>
        {eyeDropperSupported && (
          <button
            type="button"
            onClick={handleEyeDropper}
            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-black/[0.06] text-[var(--text-secondary)] transition-colors hover:bg-black/[0.04] dark:border-white/[0.08] dark:hover:bg-white/[0.06]"
            title="Pick from screen"
          >
            <Pipette size={14} />
          </button>
        )}
      </div>
      {showInput && <HexInput value={currentHex} onChange={handleHexInput} />}
      {presets && presets.length > 0 && (
        <>
          <div className="h-px bg-black/[0.06] dark:bg-white/[0.06]" />
          <PresetSwatches
            presets={presets}
            value={currentHex}
            onChange={handlePresetSelect}
          />
        </>
      )}
    </div>
  );
}

/* ─── Main Component ─── */

export function ColorPicker({
  value = "#000000",
  onChange,
  disabled = false,
  size = "middle",
  placement = "bottom-start",
  showInput = true,
  presets = DEFAULT_PRESETS,
  className,
  popupClassName,
  children,
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const hex = isValidHex(value) ? value : "#000000";

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    middleware: [offset(6), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  const handleChange = useCallback(
    (color: string) => {
      onChange?.(color);
    },
    [onChange],
  );

  // Determine whether the swatch color is dark for contrast
  const swatchStyle: CSSProperties = { backgroundColor: hex };

  return (
    <>
      {children ? (
        <div
          ref={refs.setReference}
          {...getReferenceProps()}
          className={cn(disabled && "pointer-events-none opacity-50")}
        >
          {children}
        </div>
      ) : (
        <button
          ref={refs.setReference}
          type="button"
          disabled={disabled}
          className={cn(
            "cursor-pointer rounded-lg border border-black/[0.08] transition-all hover:scale-105 hover:shadow-sm dark:border-white/[0.1]",
            disabled && "pointer-events-none opacity-50",
            SWATCH_SIZE_MAP[size],
            className,
          )}
          style={swatchStyle}
          {...getReferenceProps()}
        />
      )}
      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={{
              ...floatingStyles,
              backdropFilter: "blur(var(--window-blur, 24px))",
              WebkitBackdropFilter: "blur(var(--window-blur, 24px))",
              borderRadius: "var(--window-radius, 10px)",
            }}
            className={cn(
              "z-[9999] overflow-hidden bg-[rgba(255,255,255,calc(var(--window-opacity,85)/100))] shadow-xl border border-black/[0.06] dark:bg-[rgba(15,15,25,calc(var(--window-opacity,85)/100))] dark:border-white/[0.08]",
              popupClassName,
            )}
            {...getFloatingProps()}
          >
            <FloatingVibrancy />
            <div className="relative">
              <ColorPickerPanel
                value={hex}
                onChange={handleChange}
                presets={presets}
                showInput={showInput}
              />
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
