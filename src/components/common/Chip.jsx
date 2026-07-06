import { C } from "../../utils/constants";

export function Chip({ text, color = "gray" }) {
  const map = {
    green:  [C.greenBg,  C.greenDark],
    red:    [C.redBg,    C.redDark],
    blue:   [C.blueBg,   C.blueDark],
    amber:  [C.amberBg,  C.amberDark],
    purple: [C.purpleBg, C.purpleDark],
    gray:   ["var(--color-background-secondary)", "var(--color-text-secondary)"],
  };
  const [bg, fg] = map[color] || map.gray;
  return (
    <span style={{
      background: bg, color: fg, fontSize: 11, fontWeight: 500,
      padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap",
    }}>{text}</span>
  );
}
