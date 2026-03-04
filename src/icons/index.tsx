/**
 * Icon mapping layer: re-exports lucide-react icons with antd-like names.
 *
 * Usage:
 *   import { DeleteOutlined, EditOutlined } from "@acme/components/icons";
 *   // or
 *   import { DeleteOutlined } from "@acme/components";
 */

/**
 * StarFilled — lucide doesn't have a filled variant, so we create one.
 * Use `fill="currentColor"` on the lucide Star icon.
 */
export {
  AlertCircle as ExclamationCircleOutlined,
  AlertTriangle as WarningOutlined,
  /* ─── Navigation / UI Icons ─── */
  ArrowDown as ArrowDownOutlined,
  ArrowLeft as ArrowLeftOutlined,
  ArrowLeftRight as SwapOutlined,
  ArrowUp as ArrowUpOutlined,
  Bell as BellOutlined,
  Calendar as CalendarOutlined,
  Check as CheckOutlined,
  /* ─── Status / Indicator Icons ─── */
  CheckCircle as CheckCircleOutlined,
  ChevronDown as DownOutlined,
  ChevronRight as RightOutlined,
  Clock as ClockCircleOutlined,
  CloudDownload as CloudDownloadOutlined,
  CloudUpload as CloudUploadOutlined,
  Copy as CopyOutlined,
  Database as DatabaseOutlined,
  /* ─── Media / Domain Icons ─── */
  Download as DownloadOutlined,
  ExternalLink as LinkOutlined,
  Eye as EyeOutlined,
  EyeOff as EyeInvisibleOutlined,
  File as FileOutlined,
  FileText as FileTextOutlined,
  Filter as FilterOutlined,
  Folder as FolderOutlined,
  FolderOpen as FolderOpenOutlined,
  Globe as GlobalOutlined,
  HardDrive as HddOutlined,
  HelpCircle as QuestionCircleOutlined,
  History as HistoryOutlined,
  Hourglass as HourglassOutlined,
  Import as ImportOutlined,
  Info as InfoCircleOutlined,
  Lightbulb as BulbOutlined,
  Lock as LockOutlined,
  LogOut as LogoutOutlined,
  Menu as MenuOutlined,
  MinusCircle as MinusCircleOutlined,
  Moon as MoonOutlined,
  PauseCircle as PauseCircleOutlined,
  Pencil as EditOutlined,
  Play as PlaySquareOutlined,
  PlayCircle as PlayCircleOutlined,
  Plug as ApiOutlined,
  Plus as PlusOutlined,
  Redo as RedoOutlined,
  RefreshCw,
  Rocket as RocketOutlined,
  Save as SaveOutlined,
  ScanLine as ScanOutlined,
  Search as SearchOutlined,
  Send as SendOutlined,
  Server as CloudServerOutlined,
  Settings as ControlOutlined,
  Square as StopOutlined,
  Star as StarOutlined,
  Star as StarFilledBase,
  Sun as SunOutlined,
  Timer as FieldTimeOutlined,
  /* ─── Operation Icons ─── */
  Trash2 as DeleteOutlined,
  Upload as UploadOutlined,
  User as UserOutlined,
  UserPlus as UserAddOutlined,
  Video as VideoCameraOutlined,
  X as CloseOutlined,
  XCircle as CloseCircleOutlined,
  Zap as ThunderboltOutlined,
} from "lucide-react";

import { Loader2, RefreshCcw, RefreshCw, Star } from "lucide-react";
import { type ComponentProps, forwardRef } from "react";

export const StarFilled = forwardRef<
  SVGSVGElement,
  ComponentProps<typeof Star>
>(function StarFilled(props, ref) {
  return <Star ref={ref} {...props} fill="currentColor" />;
});

export const LoadingOutlined = forwardRef<
  SVGSVGElement,
  ComponentProps<typeof Loader2> & { spin?: boolean }
>(function LoadingOutlined({ spin, className, ...props }, ref) {
  const cls =
    [spin !== false ? "animate-spin" : "", className ?? ""]
      .filter(Boolean)
      .join(" ") || undefined;
  return <Loader2 ref={ref} className={cls} {...props} />;
});

export const SyncOutlined = forwardRef<
  SVGSVGElement,
  ComponentProps<typeof RefreshCcw> & { spin?: boolean }
>(function SyncOutlined({ spin, className, ...props }, ref) {
  const cls =
    [spin ? "animate-spin" : "", className ?? ""].filter(Boolean).join(" ") ||
    undefined;
  return <RefreshCcw ref={ref} className={cls} {...props} />;
});

export const ReloadOutlined = forwardRef<
  SVGSVGElement,
  ComponentProps<typeof RefreshCw> & { spin?: boolean }
>(function ReloadOutlined({ spin, className, ...props }, ref) {
  const cls =
    [spin ? "animate-spin" : "", className ?? ""].filter(Boolean).join(" ") ||
    undefined;
  return <RefreshCw ref={ref} className={cls} {...props} />;
});
