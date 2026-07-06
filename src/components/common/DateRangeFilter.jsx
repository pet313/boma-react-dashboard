import { Icon } from "./Icon";
import { C } from "../../utils/constants";

export function DateRangeFilter({ startDate, endDate, onStartDateChange, onEndDateChange, onClear, label = "Filter by date" }) {
  return (
    <div style={{
      display: "flex",
      gap: 12,
      alignItems: "center",
      background: "var(--color-background-primary)",
      padding: "4px 12px",
      borderRadius: 12,
      border: "0.5px solid var(--color-border-tertiary)"
    }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase" }}>
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase" }}>From</span>
        <input
          type="date"
          value={startDate}
          onChange={e => onStartDateChange(e.target.value)}
          style={{
            border: "none",
            fontSize: 12,
            background: "transparent",
            color: "var(--color-text-primary)",
            outline: "none",
            cursor: "pointer"
          }}
        />
      </div>
      <div style={{ height: 16, width: 1, background: "var(--color-border-tertiary)" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase" }}>To</span>
        <input
          type="date"
          value={endDate}
          onChange={e => onEndDateChange(e.target.value)}
          style={{
            border: "none",
            fontSize: 12,
            background: "transparent",
            color: "var(--color-text-primary)",
            outline: "none",
            cursor: "pointer"
          }}
        />
      </div>
      {(startDate || endDate) && (
        <button
          onClick={onClear}
          title="Clear date filters"
          style={{
            border: "none",
            background: "none",
            cursor: "pointer",
            color: C.red,
            display: "flex",
            alignItems: "center",
            padding: 0
          }}
        >
          <Icon name="X" size={14} />
        </button>
      )}
    </div>
  );
}