import { Icon } from "./Icon";
import { C } from "../../utils/constants";

export function Btn({ children, onClick, variant = "default", disabled, locked, loading, small, icon, className, style: sx = {} }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 6,
    fontSize: small ? 11 : 13, fontWeight: 500,
    padding: small ? "5px 12px" : "8px 16px",
    borderRadius: "var(--border-radius-md)",
    border: "none", cursor: (disabled || locked || loading) ? "not-allowed" : "pointer",
    opacity: (disabled || loading) ? 0.7 : 1, transition: "all 0.2s ease",
    fontFamily: "inherit",
    position: "relative",
  };
  const v = {
    default: { background: "var(--color-background-secondary)", color: "var(--color-text-primary)", border: "0.5px solid var(--color-border-secondary)" },
    primary: { background: C.blue,    color: "#fff" },
    success: { background: C.green,   color: "#fff" },
    danger:  { background: C.red,     color: "#fff" },
    amber:   { background: C.amber,   color: "#fff" },
    ghost: { background: "transparent", color: C.blue, border: `0.5px solid ${C.blue}` },
  };
  return (
    <button onClick={(locked || loading) ? null : onClick} disabled={disabled || loading} className={className}
      style={{ ...base, ...v[variant], ...(locked ? { opacity: 0.6, filter: 'grayscale(0.5)' } : {}), ...sx }}
      title={locked ? "This action is restricted for your role" : ""}>
      {loading ? <Icon name="Loader2" className="spin-btn-icon" size={small ? 13 : 15} /> : (
        icon && <Icon name={locked ? "Lock" : icon} size={small ? 13 : 15} />
      )}
      {children}
    </button>
  );
}
