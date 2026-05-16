import type { Tokens } from "marked";

import { renderInline } from "../core/render-inline";
import type { MarkdownComponents } from "../core/types";

export function Table({
  token,
  ctx,
}: {
  token: Tokens.Table;
  ctx?: { components?: MarkdownComponents };
}) {
  return (
    <div className="tk-md-table-wrap">
      <table className="tk-md-table">
        <thead>
          <tr>
            {token.header.map((cell, i) => (
              <th
                // biome-ignore lint/suspicious/noArrayIndexKey: table header columns are positional
                key={`h-${i}`}
                style={alignStyle(token.align[i])}
                className="tk-md-th"
              >
                {renderInline(cell.tokens, ctx)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {token.rows.map((row, ri) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: table rows are positional within one parse
            <tr key={`r-${ri}`}>
              {row.map((cell, ci) => (
                <td
                  // biome-ignore lint/suspicious/noArrayIndexKey: table cells are positional within a row
                  key={`c-${ri}-${ci}`}
                  style={alignStyle(token.align[ci])}
                  className="tk-md-td"
                >
                  {renderInline(cell.tokens, ctx)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function alignStyle(
  a: "left" | "center" | "right" | null,
): React.CSSProperties {
  if (!a) return {};
  return { textAlign: a };
}
