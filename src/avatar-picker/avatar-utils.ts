export type AvatarData =
  | { type: "icon"; icon: string; color: string }
  | { type: "text"; text: string; color: string }
  | { type: "image"; src: string };

export function parseAvatar(value: unknown): AvatarData | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const obj = value as Record<string, unknown>;

  if (obj.type === "icon") {
    if (typeof obj.icon === "string" && typeof obj.color === "string") {
      return { type: "icon", icon: obj.icon, color: obj.color };
    }
  }

  if (obj.type === "text") {
    if (typeof obj.text === "string" && typeof obj.color === "string") {
      return { type: "text", text: obj.text, color: obj.color };
    }
  }

  if (obj.type === "image") {
    if (typeof obj.src === "string") {
      return { type: "image", src: obj.src };
    }
  }

  return null;
}
