import { C } from "../../utils/constants";

export function THead({ cols }) {
  return (
    <thead>
      <tr style={{ background: C.blueDark, borderBottom: `2px solid ${C.amber}` }}>
        {cols.map(c => (
          <th key={c} style={{
            padding: "14px 16px", textAlign: "left", fontSize: 11,
            fontWeight: 700, color: C.amber,
            textTransform: "uppercase", letterSpacing: "0.08em",
          }}>{c}</th>
        ))}
      </tr>
    </thead>
  );
}

export function TD({ children, mono, center, style: sx }) {
  return (
    <td style={{
      padding: "12px 16px",
      borderBottom: "1px solid var(--color-border-tertiary)",
      fontSize: 13, color: "var(--color-text-primary)",
      fontFamily: mono ? "monospace" : "inherit",
      textAlign: center ? "center" : "left",
      ...sx,
    }}>{children}</td>
  );
}

export function DataTable({ cols, rows, empty = "No data available." }) {
  return (
    <div style={{
      overflowX: "auto",
      borderRadius: "var(--border-radius-md)",
      border: "1px solid var(--color-border-tertiary)",
      background: "var(--color-background-primary)"
    }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <THead cols={cols} />
        <tbody>
          {rows.length === 0
            ? <tr><td colSpan={cols.length} style={{ padding: "48px 24px", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 13 }}>{empty}</td></tr>
            : rows}
        </tbody>
      </table>
    </div>
  );
}
