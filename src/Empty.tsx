import { Inbox, PackageOpen } from "lucide-react";
import type { ReactNode } from "react";
import { useLocale } from "./locale";
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

const SIMPLE_SENTINEL = "__empty_simple__" as const;

export function Empty({
  image,
  imageStyle,
  description,
  children,
  className,
}: EmptyProps) {
  const locale = useLocale().Empty;
  const resolvedDescription = description ?? locale.description;
  const isSimple = image === SIMPLE_SENTINEL;

  const renderedImage = isSimple ? (
    <PackageOpen className="h-10 w-10 stroke-1 mb-2" />
  ) : (
    (image ?? <Inbox className="h-12 w-12 stroke-1 mb-2" />)
  );

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-8 text-[var(--text-muted)]",
        className,
      )}
    >
      <div style={imageStyle}>{renderedImage}</div>
      {resolvedDescription !== false && resolvedDescription !== null ? (
        <p className="text-sm mb-2">{resolvedDescription}</p>
      ) : null}
      {children}
    </div>
  );
}

Empty.PRESENTED_IMAGE_SIMPLE = SIMPLE_SENTINEL;
