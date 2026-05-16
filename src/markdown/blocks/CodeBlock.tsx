import hljs from "highlight.js";
import type { Tokens } from "marked";
import { memo, useCallback, useMemo, useState } from "react";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const CodeBlock = memo(function CodeBlock({
  token,
  streaming,
}: {
  token: Tokens.Code;
  streaming?: boolean;
}) {
  const code = token.text ?? "";
  const lang = (token.lang ?? "").trim();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard failures (e.g. permission denied)
    }
  }, [code]);

  const html = useMemo(() => {
    // While streaming, skip hljs work — re-highlighting on every chunk is expensive
    // and the user is rarely staring at incomplete code anyway.
    if (streaming) return escapeHtml(code);
    try {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlightAuto(code).value;
    } catch {
      return escapeHtml(code);
    }
  }, [code, lang, streaming]);

  return (
    <div className="tk-md-code-block group">
      <div className="tk-md-code-header">
        <span className="tk-md-code-lang">{lang || "text"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="tk-md-code-copy cursor-pointer"
          aria-label={copied ? "Copied" : "Copy code"}
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <pre className="tk-md-code-pre">
        <code
          className={lang ? `hljs language-${lang}` : "hljs"}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: output from highlight.js / escapeHtml
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </pre>
    </div>
  );
});
