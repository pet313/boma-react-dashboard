import * as Lucide from "lucide-react";

export function Icon({ name, size = 18, color, style, className, strokeWidth = 2 }) {
  const LucideIcon = Lucide[name];
  if (!LucideIcon) return null;
  return <LucideIcon size={size} color={color} style={style} className={className} strokeWidth={strokeWidth} />;
}
