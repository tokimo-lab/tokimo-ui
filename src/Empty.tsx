import { Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "./utils";

export interface EmptyProps {
  /** Logo/image to display */
  image?: ReactNode;
  /** Use small variant */
  imageStyle?: React.CSSProperties;
  /** Description text */
  description?: ReactNode;
  /** Extra action below description */
  children?: ReactNode;
  className?: string;
}

export function Empty({
  image,
  imageStyle,
  description = "暂无数据",
  children,
  className,
}: EmptyProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-500",
        className,
      )}
    >
      <div style={imageStyle}>
        {image ?? <Inbox className="h-12 w-12 stroke-1 mb-2" />}
      </div>
      {description !== false && description !== null ? (
        <p className="text-sm mb-2">{description}</p>
      ) : null}
      {children}
    </div>
  );
}

Empty.PRESENTED_IMAGE_SIMPLE = "simple" as const;
