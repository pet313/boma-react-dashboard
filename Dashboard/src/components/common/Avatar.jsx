import { ROLE_META } from "../../utils/constants";
import { getInitials } from "../../utils/helpers";

export function Avatar({ name, role, size = 34 }) {
  const meta = ROLE_META[role] || ROLE_META.viewer;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: meta.bg, color: meta.color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: Math.round(size * 0.35), fontWeight: 500,
    }}>{getInitials(name)}</div>
  );
}
