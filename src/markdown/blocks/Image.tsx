import type { Tokens } from "marked";

export function Image({ token }: { token: Tokens.Image }) {
  return (
    <img
      src={token.href}
      alt={token.text}
      title={token.title ?? undefined}
      loading="lazy"
      className="tk-md-image"
    />
  );
}
