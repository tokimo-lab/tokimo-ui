import type { Tokens } from "marked";

export function Image({
  token,
  sourceLine,
}: {
  token: Tokens.Image;
  sourceLine?: number;
}) {
  return (
    <img
      src={token.href}
      alt={token.text}
      title={token.title ?? undefined}
      loading="lazy"
      className="tk-md-image"
      data-source-line={sourceLine}
    />
  );
}
