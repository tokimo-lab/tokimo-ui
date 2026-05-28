import {
  Activity,
  Album,
  Archive,
  BookMarked,
  Bookmark,
  BookOpen,
  Box,
  Briefcase,
  Bug,
  Building,
  Building2,
  Calendar,
  Camera,
  ChartBar,
  CheckCircle,
  Circle,
  Clipboard,
  Clock,
  Cloud,
  Code,
  Code2,
  Coffee,
  Compass,
  Cpu,
  Database,
  Disc,
  Disc3,
  Download,
  Droplet,
  Eye,
  File,
  FileText,
  Film,
  Flag,
  Flame,
  Folder,
  FolderOpen,
  Gift,
  GitBranch,
  Globe,
  GraduationCap,
  HardDrive,
  Hash,
  Headphones,
  Heart,
  Home,
  Image,
  Images,
  Inbox,
  Info,
  Key,
  Layers,
  Library,
  Lightbulb,
  Link,
  List,
  Lock,
  type LucideIcon,
  Mail,
  Map as MapIcon,
  MapPin,
  Megaphone,
  MessageCircle,
  Mic,
  Monitor,
  Moon,
  Music,
  Music2,
  Music3,
  Music4,
  Newspaper,
  Package,
  Palette,
  Paperclip,
  Pencil,
  Phone,
  Play,
  Podcast,
  Radio,
  Rocket,
  Save,
  Search,
  Send,
  Server,
  Settings,
  Share2,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Speaker,
  Square,
  Star,
  Sun,
  Tag,
  Target,
  Terminal,
  Trash,
  TrendingUp,
  Trophy,
  Tv,
  Upload,
  User,
  Users,
  Video,
  Volume2,
  Wallet,
  Wifi,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Popover } from "../Popover";
import { ScrollArea } from "../ScrollArea";
import { cn } from "../utils";
import type { AvatarData } from "./avatar-utils";

export interface AvatarPickerProps {
  value: AvatarData | null;
  onChange: (value: AvatarData | null) => void;
  size?: number;
  placeholder?: string;
}

const PRESET_COLORS = [
  "#ec4899",
  "#8b5cf6",
  "#3b82f6",
  "#06b6d4",
  "#10b981",
  "#84cc16",
  "#eab308",
  "#f97316",
  "#ef4444",
  "#e11d48",
  "#7c3aed",
  "#0ea5e9",
  "#14b8a6",
  "#22c55e",
  "#a3e635",
  "#facc15",
];

// Icon map: kebab-case keys to React components
const ICON_MAP: Record<string, LucideIcon> = {
  "lucide:activity": Activity,
  "lucide:album": Album,
  "lucide:archive": Archive,
  "lucide:bookmark": Bookmark,
  "lucide:book-marked": BookMarked,
  "lucide:book-open": BookOpen,
  "lucide:box": Box,
  "lucide:briefcase": Briefcase,
  "lucide:bug": Bug,
  "lucide:building": Building,
  "lucide:building-2": Building2,
  "lucide:calendar": Calendar,
  "lucide:camera": Camera,
  "lucide:chart-bar": ChartBar,
  "lucide:check-circle": CheckCircle,
  "lucide:circle": Circle,
  "lucide:clipboard": Clipboard,
  "lucide:clock": Clock,
  "lucide:cloud": Cloud,
  "lucide:code": Code,
  "lucide:code-2": Code2,
  "lucide:coffee": Coffee,
  "lucide:compass": Compass,
  "lucide:cpu": Cpu,
  "lucide:database": Database,
  "lucide:disc": Disc,
  "lucide:disc-3": Disc3,
  "lucide:download": Download,
  "lucide:droplet": Droplet,
  "lucide:eye": Eye,
  "lucide:file": File,
  "lucide:file-text": FileText,
  "lucide:film": Film,
  "lucide:flag": Flag,
  "lucide:flame": Flame,
  "lucide:folder": Folder,
  "lucide:folder-open": FolderOpen,
  "lucide:gift": Gift,
  "lucide:git-branch": GitBranch,
  "lucide:globe": Globe,
  "lucide:graduation-cap": GraduationCap,
  "lucide:hard-drive": HardDrive,
  "lucide:hash": Hash,
  "lucide:headphones": Headphones,
  "lucide:heart": Heart,
  "lucide:home": Home,
  "lucide:image": Image,
  "lucide:images": Images,
  "lucide:inbox": Inbox,
  "lucide:info": Info,
  "lucide:key": Key,
  "lucide:layers": Layers,
  "lucide:library": Library,
  "lucide:lightbulb": Lightbulb,
  "lucide:link": Link,
  "lucide:list": List,
  "lucide:lock": Lock,
  "lucide:mail": Mail,
  "lucide:map": MapIcon,
  "lucide:map-pin": MapPin,
  "lucide:megaphone": Megaphone,
  "lucide:message-circle": MessageCircle,
  "lucide:mic": Mic,
  "lucide:monitor": Monitor,
  "lucide:moon": Moon,
  "lucide:music": Music,
  "lucide:music-2": Music2,
  "lucide:music-3": Music3,
  "lucide:music-4": Music4,
  "lucide:newspaper": Newspaper,
  "lucide:package": Package,
  "lucide:palette": Palette,
  "lucide:paperclip": Paperclip,
  "lucide:pencil": Pencil,
  "lucide:phone": Phone,
  "lucide:play": Play,
  "lucide:podcast": Podcast,
  "lucide:radio": Radio,
  "lucide:rocket": Rocket,
  "lucide:save": Save,
  "lucide:search": Search,
  "lucide:send": Send,
  "lucide:server": Server,
  "lucide:settings": Settings,
  "lucide:share-2": Share2,
  "lucide:shield": Shield,
  "lucide:shopping-bag": ShoppingBag,
  "lucide:shopping-cart": ShoppingCart,
  "lucide:smartphone": Smartphone,
  "lucide:sparkles": Sparkles,
  "lucide:speaker": Speaker,
  "lucide:square": Square,
  "lucide:star": Star,
  "lucide:sun": Sun,
  "lucide:tag": Tag,
  "lucide:target": Target,
  "lucide:terminal": Terminal,
  "lucide:trash": Trash,
  "lucide:trending-up": TrendingUp,
  "lucide:trophy": Trophy,
  "lucide:tv": Tv,
  "lucide:upload": Upload,
  "lucide:user": User,
  "lucide:users": Users,
  "lucide:video": Video,
  "lucide:volume-2": Volume2,
  "lucide:wallet": Wallet,
  "lucide:wifi": Wifi,
  "lucide:zap": Zap,
};

const ICON_NAMES = Object.keys(ICON_MAP) as Array<keyof typeof ICON_MAP>;

// Helper to normalize icon key: "Music" or "music" -> "lucide:music"
function normalizeIconKey(iconKey: string): string {
  if (iconKey.startsWith("lucide:")) {
    return iconKey;
  }
  // Convert PascalCase to kebab-case and add prefix
  const kebab = iconKey
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase()
    .replace(/^-/, "");
  return `lucide:${kebab}`;
}

export function AvatarPicker({
  value,
  onChange,
  size = 48,
  placeholder = "选择图标",
}: AvatarPickerProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"icon" | "color">("icon");

  const currentColor = value?.color || PRESET_COLORS[0];

  const handleIconSelect = (iconKey: string) => {
    onChange({ type: "icon", icon: iconKey, color: currentColor });
    setOpen(false);
  };

  const handleColorSelect = (color: string) => {
    if (value) {
      onChange({ ...value, color });
    } else {
      onChange({ type: "icon", icon: ICON_NAMES[0], color });
    }
  };

  const renderPreview = () => {
    if (!value) {
      return (
        <div className="flex items-center justify-center text-sm text-[var(--text-tertiary)]">
          {placeholder}
        </div>
      );
    }

    if (value.type === "icon") {
      // Normalize icon key to handle both "lucide:music" and "Music" formats
      const normalizedKey = normalizeIconKey(value.icon);
      const IconComponent = ICON_MAP[normalizedKey as keyof typeof ICON_MAP];
      if (IconComponent) {
        return <IconComponent size={size * 0.5} className="text-white" />;
      }
    }

    if (value.type === "text") {
      return (
        <div
          className="text-white font-medium"
          style={{ fontSize: `${size * 0.4}px` }}
        >
          {value.text.slice(0, 2).toUpperCase()}
        </div>
      );
    }

    return null;
  };

  const popoverContent = (
    <div className="w-80">
      {/* Tabs */}
      <div className="flex border-b border-border-base mb-3">
        <button
          type="button"
          onClick={() => setActiveTab("icon")}
          className={cn(
            "flex-1 px-4 py-2 text-sm font-medium transition-colors cursor-pointer",
            activeTab === "icon"
              ? "text-[var(--accent)] border-b-2 border-[var(--accent)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
          )}
        >
          图标
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("color")}
          className={cn(
            "flex-1 px-4 py-2 text-sm font-medium transition-colors cursor-pointer",
            activeTab === "color"
              ? "text-[var(--accent)] border-b-2 border-[var(--accent)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
          )}
        >
          颜色
        </button>
      </div>

      {/* Icon Tab */}
      {activeTab === "icon" && (
        <ScrollArea className="h-80">
          <div className="grid grid-cols-6 gap-2 p-2">
            {ICON_NAMES.map((iconKey) => {
              const IconComponent = ICON_MAP[iconKey];
              const isSelected =
                value?.type === "icon" &&
                normalizeIconKey(value.icon) === iconKey;
              return (
                <button
                  key={iconKey}
                  type="button"
                  onClick={() => handleIconSelect(iconKey)}
                  className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center transition-all cursor-pointer",
                    "hover:bg-black/5 dark:hover:bg-white/10",
                    isSelected &&
                      "bg-[var(--accent)]/10 ring-2 ring-[var(--accent)]",
                  )}
                  title={iconKey}
                >
                  <IconComponent
                    size={24}
                    className={cn(
                      isSelected
                        ? "text-[var(--accent)]"
                        : "text-[var(--text-secondary)]",
                    )}
                  />
                </button>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {/* Color Tab */}
      {activeTab === "color" && (
        <div className="p-4">
          <div className="grid grid-cols-8 gap-2">
            {PRESET_COLORS.map((color) => {
              const isSelected = value?.color === color;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorSelect(color)}
                  className={cn(
                    "w-8 h-8 rounded-lg transition-all cursor-pointer",
                    "hover:scale-110",
                    isSelected && "ring-2 ring-offset-2 ring-[var(--accent)]",
                  )}
                  style={{ backgroundColor: color }}
                  title={color}
                  aria-label={`选择颜色 ${color}`}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Popover
      trigger="click"
      placement="bottom"
      open={open}
      onOpenChange={setOpen}
      content={popoverContent}
    >
      <button
        type="button"
        className="flex items-center justify-center rounded-full cursor-pointer transition-transform hover:scale-105"
        style={{
          width: size,
          height: size,
          backgroundColor: value?.color || "#e5e7eb",
        }}
      >
        {renderPreview()}
      </button>
    </Popover>
  );
}
