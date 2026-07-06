import { Icon } from "./Icon";
import { C } from "../../utils/constants";

export function Toast({ msg, type }) {
  if (!msg) return null;
  const bg = type === "error" ? C.redBg : C.greenBg;
  const fg = type === "error" ? C.redDark : C.greenDark;
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: bg, color: fg, padding: "12px 20px",
      borderRadius: "var(--border-radius-md)", fontSize: 13, fontWeight: 500,
      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      border: `0.5px solid ${type === "error" ? C.red : C.green}`,
    }}>
      <Icon name={type === "error" ? "AlertCircle" : "CheckCircle2"} size={16} style={{ marginRight: 8, display: 'inline-block', verticalAlign: 'middle' }} />
      {msg}
    </div>
  );
}
