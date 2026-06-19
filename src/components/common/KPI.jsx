import { Icon } from "./Icon";
import { C, s } from "../../utils/constants";

export function KPI({ label, value, sub, subColor, icon, theme = "blue", loading }) {
  if (loading) {
    return (
      <div className="metric" style={{ background: "var(--color-background-secondary)", display: "flex", flexDirection: "column", gap: 10, alignItems: "center", justifyContent: "center", minHeight: 110 }}>
        <div className="skeleton-box" style={{ height: 12, width: "50%" }} />
        <div className="skeleton-box" style={{ height: 28, width: "40%" }} />
        <div className="skeleton-box" style={{ height: 10, width: "30%" }} />
      </div>
    );
  }
  const themes = {
    blue:   `linear-gradient(135deg, ${C.blue} 0%, ${C.blueDark} 100%)`,
    green:  `linear-gradient(135deg, ${C.green} 0%, ${C.greenDark} 100%)`,
    red:    `linear-gradient(135deg, ${C.red} 0%, ${C.redDark} 100%)`,
    amber:  `linear-gradient(135deg, ${C.amber} 0%, ${C.amberDark} 100%)`,
    purple: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)`,
    black:  "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
  };

  return (
    <div
      className="kpi-card"
      style={{ /* Inline styles for dynamic background gradients */
        ...s.metric, background: themes[theme], display: "flex", flexDirection: "column",
        gap: 4, alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: 110,
        cursor: "default"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
        {icon && <Icon name={icon} size={18} color="rgba(255,255,255,0.5)" />}
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</span>
      </div>
      <div style={{ fontSize: "clamp(24px, 5vw, 34px)", fontWeight: 800, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}
