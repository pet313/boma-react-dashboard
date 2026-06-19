import { Icon } from "../common/Icon";
import { Btn } from "../common/Btn";
import { C, NAV } from "../../utils/constants";
import kmcslogan from '../../assets/kmcslogan.png'

export function TopBar({ active, onRefresh, theme, setTheme, setIsCollapsed, isCollapsed }) {
  const nav = NAV.find(n => n.id === active);
  return (
    <div style={{
      padding: "14px 16px",
      background: "var(--color-background-primary)",
      borderBottom: "0.5px solid var(--color-border-tertiary)",
      display: "flex", alignItems: "center", gap: 16
    }}>
      <Btn onClick={() => setIsCollapsed(!isCollapsed)} variant="default" small icon={isCollapsed ? "PanelLeftOpen" : "PanelLeftClose"} />
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {nav && <Icon name={nav.icon} size={18} color={C.blue} />}
        <span style={{ fontSize: 16, fontWeight: 500 }}>{nav?.label || ""}</span>
      </div>
      <div className="kmc-slogan" style={{ margin: "auto", display: "flex", alignItems: "center", width: "auto", height: 50 }}>
               <img
        src={kmcslogan}
        alt="KMC slogan"
        style={{ width: 200, height: 50, borderRadius: 10,justifyContent: "center",
               }}
       />
            </div>
      <div className="topbar-actions" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{
          fontSize: 11, padding: "4px 12px", borderRadius: 20,
          background: C.greenBg, color: C.greenDark, fontWeight: 500,
        }}>
          <Icon name="Wifi" size={11} style={{ marginRight: 4, display: 'inline-block', verticalAlign: 'middle' }} />
          Live
        </span>
        <Btn onClick={() => setTheme(theme === "light" ? "dark" : "light")} variant="default" small icon={theme === "light" ? "Moon" : "Sun"}>
          {theme === "light" ? "Dark" : "Light"}
        </Btn>
        <Btn className="hide-mobile" onClick={onRefresh} variant="default" small icon="RotateCw">Refresh</Btn>

      </div>
    </div>
  );
}
