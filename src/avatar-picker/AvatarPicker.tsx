import {
  ImagePlus,
  icons,
  type LucideIcon,
  Pencil,
  Search,
  Smile,
  Type,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { Input } from "../Input";
import { Popover } from "../Popover";
import { ScrollArea } from "../ScrollArea";
import { Tabs } from "../Tabs";
import { cn } from "../utils";
import type { AvatarData } from "./avatar-utils";

export interface AvatarPickerProps {
  value: AvatarData | null;
  onChange: (value: AvatarData | null) => void;
  size?: number;
  placeholder?: string;
}

const PRESET_COLORS = [
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#ec4899",
  "#f43f5e",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#78716c",
  "#1e293b",
];

const DEFAULT_COLOR = "#3b82f6";

interface IconEntry {
  name: string;
  component: LucideIcon;
}

const ALL_ICONS: IconEntry[] = Object.entries(icons)
  .filter(([name]) => {
    const lower = name.toLowerCase();
    return !lower.startsWith("lucide") && !lower.endsWith("icon");
  })
  .map(([pascal, component]) => {
    const kebab = pascal
      .replace(/([A-Z])/g, "-$1")
      .toLowerCase()
      .replace(/^-/, "");
    return { name: kebab, component };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

const CURATED_EMOJIS = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😆",
  "😅",
  "🤣",
  "😂",
  "🙂",
  "🙃",
  "😉",
  "😊",
  "😇",
  "🥰",
  "😍",
  "🤩",
  "😘",
  "😗",
  "😚",
  "😙",
  "😋",
  "😛",
  "😜",
  "🤪",
  "��",
  "🤑",
  "🤗",
  "🤭",
  "🤫",
  "🤔",
  "🤐",
  "🤨",
  "😐",
  "😑",
  "😶",
  "😏",
  "😒",
  "🙄",
  "😬",
  "🤥",
  "😌",
  "😔",
  "😪",
  "🤤",
  "😴",
  "😷",
  "🤒",
  "🤕",
  "🤢",
  "🤮",
  "🤧",
  "🥵",
  "🥶",
  "😎",
  "🤓",
  "🧐",
  "😕",
  "😟",
  "🙁",
  "😮",
  "😯",
  "😲",
  "😳",
  "🥺",
  "😦",
  "��",
  "😨",
  "😰",
  "😥",
  "😢",
  "😭",
  "😱",
  "😖",
  "😣",
  "😞",
  "😓",
  "😩",
  "😫",
  "🥱",
  "😤",
  "😡",
  "😠",
  "🤬",
  "😈",
  "👿",
  "💀",
  "💩",
  "🤡",
  "👻",
  "👽",
  "👾",
  "🤖",
  "😺",
  "😸",
  "😹",
  "😻",
  "😼",
  "😽",
  "🙀",
  "😿",
  "😾",
  "❤️",
  "🧡",
  "💛",
  "💚",
  "💙",
  "��",
  "🤎",
  "🖤",
  "🤍",
  "💯",
  "💢",
  "💥",
  "💫",
  "💦",
  "💨",
  "🕳️",
  "💬",
  "👁️",
  "🗨️",
  "🗯️",
  "💭",
  "💤",
  "👋",
  "🤚",
  "🖐️",
  "✋",
  "🖖",
  "👌",
  "🤌",
  "🤏",
  "✌️",
  "🤞",
  "🤟",
  "🤘",
  "🤙",
  "👈",
  "👉",
  "👆",
  "🖕",
  "👇",
  "☝️",
  "👍",
  "👎",
  "✊",
  "👊",
  "🤛",
  "🤜",
  "👏",
  "🙌",
  "👐",
  "🤲",
  "🤝",
  "🙏",
  "✍️",
  "💅",
  "🤳",
  "💪",
  "🦾",
  "🦿",
  "🦵",
  "🦶",
  "👂",
  "🦻",
  "👃",
  "🧠",
  "🦷",
  "🦴",
  "👀",
  "👁️",
  "👅",
  "👄",
  "💋",
  "🩸",
  "👶",
  "🧒",
  "🚀",
  "🛸",
  "⭐",
  "🌟",
  "✨",
  "💫",
  "🌙",
  "🌛",
  "🌜",
  "☀️",
  "🌝",
  "🌞",
  "🪐",
  "⚡",
  "☄️",
  "💥",
  "🔥",
  "🌈",
  "☁️",
  "⛅",
  "🌤️",
  "⛈️",
  "🌧️",
  "❄️",
  "☃️",
  "⛄",
  "🌊",
  "💧",
  "💦",
  "🌍",
  "🌎",
  "🌏",
  "🐶",
  "🐱",
  "🐭",
  "🐹",
  "🐰",
  "🦊",
  "🐻",
  "🐼",
  "🐨",
  "🐯",
  "🦁",
  "🐮",
  "🐷",
  "🐸",
  "🐵",
  "🐔",
  "🐧",
  "🐦",
  "🐤",
  "🐣",
  "🐥",
  "🦆",
  "🦅",
  "🦉",
  "🦇",
  "🐺",
  "🐗",
  "🐴",
  "🦄",
  "🐝",
  "🐛",
  "🦋",
  "🐌",
  "🐞",
  "🐜",
  "🦟",
  "🦗",
  "🦂",
  "🐢",
  "🐍",
  "🍎",
  "🍊",
  "🍋",
  "🍌",
  "🍉",
  "🍇",
  "🍓",
  "🍈",
  "🍒",
  "🍑",
  "🥭",
  "🍍",
  "🥥",
  "🥝",
  "🍅",
  "🍆",
  "🥑",
  "🥦",
  "🥬",
  "🥒",
  "🌶️",
  "🌽",
  "🥕",
  "🥔",
  "⚽",
  "🏀",
  "🏈",
  "⚾",
  "🥎",
  "🎾",
  "🏐",
  "🏉",
  "🥏",
  "🎱",
  "🏓",
  "🏸",
  "🏒",
  "🏑",
  "🥍",
  "🏏",
  "🏆",
  "🥇",
  "🥈",
  "🥉",
  "🏅",
  "🎖️",
  "🎗️",
  "🎫",
  "🎟️",
  "🎪",
  "🎭",
  "🎨",
  "🎬",
  "🎤",
  "🎧",
  "🎼",
  "🎹",
  "🥁",
  "🎷",
  "🎺",
  "🎸",
  "🪕",
  "🎻",
  "🎲",
  "♠️",
  "♥️",
  "♦️",
  "♣️",
  "🃏",
  "🀄",
  "🎴",
  "🎯",
  "🎰",
  "🧩",
  "♟️",
  "🎮",
  "🕹️",
  "👾",
  "🎳",
  "🎣",
  "✈️",
  "🚁",
  "🚂",
  "🚃",
  "🚄",
  "🚅",
  "🚆",
  "🚇",
  "🚈",
  "🚉",
  "🚊",
  "🚝",
  "🚞",
  "🚋",
  "🚌",
  "🚍",
  "💡",
  "🔦",
  "🕯️",
  "🪔",
  "🔌",
  "🔋",
  "💻",
  "🖥️",
  "🖨️",
  "⌨️",
  "🖱️",
  "💾",
  "💿",
  "📀",
  "📱",
  "☎️",
  "📞",
  "📟",
  "📠",
  "📺",
  "📻",
  "🎙️",
  "🎚️",
  "🎛️",
  "⏰",
  "🕰️",
  "⏱️",
  "⏲️",
  "⌚",
  "📡",
  "🔭",
  "🔬",
  "❤️",
  "🧡",
  "💛",
  "💚",
  "💙",
  "💜",
  "🖤",
  "🤍",
  "🤎",
  "💔",
  "❣️",
  "💕",
  "💞",
  "💓",
  "💗",
  "💖",
  "💘",
  "💝",
  "💟",
  "☮️",
  "✝️",
  "☪️",
  "🕉️",
  "☸️",
  "✡️",
  "🔯",
  "🕎",
  "☯️",
  "☦️",
  "🛐",
  "⛎",
  "♈",
  "🏁",
  "🚩",
  "🎌",
  "🏴",
  "🏳️",
  "🏳️‍🌈",
  "🏴‍☠️",
];

function currentColor(value: AvatarData | null): string {
  if (!value) return DEFAULT_COLOR;
  if (value.type === "text" || value.type === "icon") return value.color;
  return DEFAULT_COLOR;
}

function normalizeIconKey(iconKey: string): string {
  if (iconKey.startsWith("lucide:")) {
    return iconKey.slice(7);
  }
  const kebab = iconKey
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase()
    .replace(/^-/, "");
  return kebab;
}

function getIconComponent(iconKey: string): LucideIcon | undefined {
  const normalized = normalizeIconKey(iconKey);
  return ALL_ICONS.find((i) => i.name === normalized)?.component;
}

function storageUrl(src: string): string {
  if (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("/storage/")
  ) {
    return src;
  }
  return `/storage/${src}`;
}

function IconGrid({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (name: string) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    if (!query) return ALL_ICONS;
    const lower = query.toLowerCase();
    return ALL_ICONS.filter((i) => i.name.includes(lower));
  }, [query]);

  return (
    <div className="flex flex-col gap-2">
      <Input
        size="small"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜索图标..."
        prefix={<Search className="h-3.5 w-3.5" />}
        allowClear
      />
      <ScrollArea className="h-[220px]">
        <div className="grid grid-cols-9 gap-1 p-1">
          {filtered.map((entry) => {
            const Icon = entry.component;
            const isSelected = normalizeIconKey(selected) === entry.name;
            return (
              <button
                key={entry.name}
                type="button"
                onClick={() => onSelect(entry.name)}
                className={cn(
                  "flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-all",
                  isSelected
                    ? "scale-110 bg-blue-500 text-white shadow-md"
                    : "hover:bg-black/5 dark:hover:bg-white/10",
                )}
                title={entry.name}
              >
                <Icon className="h-[18px] w-[18px]" />
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

function EmojiGrid({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (emoji: string) => void;
}) {
  return (
    <ScrollArea className="h-[220px]">
      <div className="grid grid-cols-9 gap-1 p-1">
        {CURATED_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSelect(emoji)}
            className={cn(
              "flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-lg transition-all",
              selected === emoji
                ? "scale-110 bg-blue-500/20 shadow-md ring-1 ring-blue-500"
                : "hover:bg-black/5 dark:hover:bg-white/10",
            )}
          >
            {emoji}
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}

export function AvatarPicker({
  value,
  onChange,
  size = 40,
  placeholder,
}: AvatarPickerProps) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const color = currentColor(value);

  const handleColorSelect = useCallback(
    (c: string) => {
      if (!value || value.type === "image") {
        onChange({ type: "icon", icon: placeholder ?? "home", color: c });
        return;
      }
      onChange({ ...value, color: c });
    },
    [value, onChange, placeholder],
  );

  const handleTextChange = useCallback(
    (text: string) => {
      onChange({ type: "text", text, color });
    },
    [onChange, color],
  );

  const handleIconSelect = useCallback(
    (name: string) => {
      onChange({ type: "icon", icon: `lucide:${name}`, color });
    },
    [onChange, color],
  );

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      onChange({ type: "text", text: emoji, color });
    },
    [onChange, color],
  );

  const handleClear = useCallback(() => {
    onChange(null);
  }, [onChange]);

  const handleUploadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setUploadError("只支持图片文件");
        return;
      }
      setUploading(true);
      setUploadError(null);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/storage/upload/icon", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(body.error ?? "上传失败");
        }
        const json = (await res.json()) as {
          success: boolean;
          data?: { key?: string } | string;
          error?: string;
        };
        if (!json.success) {
          throw new Error(json.error ?? "上传失败");
        }
        let key: string;
        if (typeof json.data === "string") {
          key = json.data;
        } else if (
          json.data &&
          typeof json.data === "object" &&
          "key" in json.data
        ) {
          key = json.data.key ?? "";
        } else {
          throw new Error("服务器返回格式错误");
        }
        onChange({ type: "image", src: key });
        setUploadError(null);
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "上传失败");
      } finally {
        setUploading(false);
      }
    },
    [onChange],
  );

  const textValue = value?.type === "text" ? value.text : "";

  const renderIconOrText = (
    icon: string | undefined,
    _color: string | undefined,
    iconSize: number,
  ) => {
    if (!icon) return null;
    const IconComponent = getIconComponent(icon);
    if (IconComponent) {
      return (
        <IconComponent
          className="text-white"
          style={{ width: iconSize, height: iconSize }}
        />
      );
    }
    return (
      <div
        className="font-medium text-white"
        style={{ fontSize: `${iconSize * 0.7}px` }}
      >
        {icon.slice(0, 2).toUpperCase()}
      </div>
    );
  };

  const previewNode =
    value?.type === "image" ? (
      <img
        src={storageUrl(value.src)}
        alt="avatar"
        className="h-16 w-16 rounded-[20%] object-cover"
      />
    ) : (
      <div
        className="flex h-16 w-16 items-center justify-center rounded-[20%]"
        style={{ backgroundColor: color }}
      >
        {renderIconOrText(
          value?.type === "icon"
            ? value.icon
            : value?.type === "text"
              ? value.text
              : placeholder,
          color,
          32,
        )}
      </div>
    );

  const panel = (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center justify-between">
        {previewNode}
        <button
          type="button"
          className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          onClick={handleClear}
        >
          <X className="h-3 w-3" />
          清除
        </button>
      </div>

      <div>
        <div className="mb-1.5 text-xs font-medium">背景色</div>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={cn(
                "h-6 w-6 cursor-pointer rounded-full border-2 transition-all",
                color === c
                  ? "scale-110 border-gray-800 shadow-md dark:border-white"
                  : "border-transparent hover:scale-110",
              )}
              style={{ backgroundColor: c }}
              onClick={() => handleColorSelect(c)}
            />
          ))}
          <button
            type="button"
            className={cn(
              "flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-2 transition-all",
              "bg-black/5 dark:bg-white/10",
              color === "transparent"
                ? "scale-110 border-gray-800 shadow-md dark:border-white"
                : "border-transparent hover:scale-110",
            )}
            onClick={() => handleColorSelect("transparent")}
          >
            <span className="block h-[1.5px] w-3.5 -rotate-45 rounded-full bg-red-400" />
          </button>
        </div>
      </div>

      <Tabs
        size="small"
        defaultActiveKey="icon"
        items={[
          {
            key: "text",
            label: (
              <span className="flex items-center gap-1">
                <Type className="h-3.5 w-3.5" />
                文字
              </span>
            ),
            children: (
              <div className="flex flex-col gap-2 pt-2">
                <Input
                  value={textValue}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="输入文字或 emoji"
                  maxLength={8}
                  size="small"
                />
                <p className="text-xs">最多 4 个汉字或 8 个英文字符</p>
              </div>
            ),
          },
          {
            key: "emoji",
            label: (
              <span className="flex items-center gap-1">
                <Smile className="h-3.5 w-3.5" />
                表情
              </span>
            ),
            children: (
              <div className="pt-2">
                <EmojiGrid
                  selected={value?.type === "text" ? value.text : ""}
                  onSelect={handleEmojiSelect}
                />
              </div>
            ),
          },
          {
            key: "icon",
            label: (
              <span className="flex items-center gap-1">
                <span className="text-sm">⊞</span>
                图标
              </span>
            ),
            children: (
              <div className="pt-2">
                <IconGrid
                  selected={value?.type === "icon" ? value.icon : ""}
                  onSelect={handleIconSelect}
                />
              </div>
            ),
          },
          {
            key: "upload",
            label: (
              <span className="flex items-center gap-1">
                <Upload className="h-3.5 w-3.5" />
                上传
              </span>
            ),
            children: (
              <div className="pt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadFile(file);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  className={cn(
                    "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-8 transition-colors",
                    dragOver
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-black/[0.08] dark:border-white/[0.1] hover:border-black/20 dark:hover:border-white/20",
                    uploading && "pointer-events-none opacity-50",
                  )}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file) handleUploadFile(file);
                  }}
                >
                  <Upload className="h-8 w-8" />
                  <p className="text-sm">
                    {uploading ? "上传中..." : "点击或拖拽图片到这里"}
                  </p>
                  <p className="text-xs">支持 JPG、PNG、WebP，建议正方形</p>
                </button>
                {uploadError && (
                  <p className="mt-2 text-xs text-red-500">{uploadError}</p>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );

  const hasAvatar =
    (value?.type === "icon" && value.icon) ||
    (value?.type === "text" && value.text) ||
    value?.type === "image";

  return (
    <Popover
      trigger="click"
      placement="bottomLeft"
      content={panel}
      open={open}
      onOpenChange={setOpen}
    >
      <button type="button" className="group relative w-fit cursor-pointer">
        {hasAvatar ? (
          value?.type === "image" ? (
            <img
              src={storageUrl(value.src)}
              alt="avatar"
              className="rounded-[20%] object-cover"
              style={{ width: size, height: size }}
            />
          ) : (
            <div
              className="flex items-center justify-center rounded-[20%]"
              style={{
                width: size,
                height: size,
                backgroundColor:
                  value?.type === "icon" || value?.type === "text"
                    ? value.color
                    : "#e5e7eb",
              }}
            >
              {renderIconOrText(
                value?.type === "icon"
                  ? value.icon
                  : value?.type === "text"
                    ? value.text
                    : "",
                value?.type === "icon" || value?.type === "text"
                  ? value.color
                  : "#e5e7eb",
                size * 0.5,
              )}
            </div>
          )
        ) : (
          <div
            className="flex items-center justify-center rounded-[20%] bg-black/5 dark:bg-white/10"
            style={{ width: size, height: size }}
          >
            <ImagePlus style={{ width: size * 0.4, height: size * 0.4 }} />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[20%] bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
          <Pencil
            className="text-white"
            style={{ width: size * 0.25, height: size * 0.25 }}
          />
        </div>
      </button>
    </Popover>
  );
}
