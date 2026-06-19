import { Icon } from "../common/Icon";
import { Avatar } from "../common/Avatar";
import { C, NAV, ROLE_META } from "../../utils/constants";
import kmclogo from '../../assets/kmclogo.jpg'

export function Sidebar({ active, setActive, currentUser, onLogout, onRefresh, loading, onlineCount, mobCount, isCollapsed, setIsCollapsed }) {
  return (
    <div
      className="sidebar-container"
      style={{
        display: "flex", flexDirection: "column",
        background: "var(--color-sidebar-bg)",
        backdropFilter: "var(--color-sidebar-blur)",
        WebkitBackdropFilter: "var(--color-sidebar-blur)",
        color: "#fff", height: "100vh",
        position: "sticky", top: 0,
        width: isCollapsed ? 80 : 260,
        boxShadow: "8px 0 32px rgba(0, 0, 0, 0.25)",
        borderTop: `4px solid ${C.red}`,
        transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <style>{`
        .sidebar-nav::-webkit-scrollbar { display: none; }
        .sidebar-nav { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      {/* Logo */}
      <div style={{ padding: "28px 24px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ position: "relative", width: 34, height: 34 }}>
             <img
      src={kmclogo}
      alt="KMC Logo"
      style={{ width: 34, height: 34, borderRadius: 10,justifyContent: "center",
            boxShadow: `0 4px 12px ${C.red}40`, }}
     />
          </div>
          {!isCollapsed && <div className="sidebar-logo-text">
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 16, lineHeight: 1.2, letterSpacing: "-0.02em" }}>KENYA MEAT COMMISSION</div>
            <div style={{ color: "hsl(41, 100%, 53%)", fontSize: 13 }}>Boma Dashboard</div>
          </div>}
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav" style={{ flex: 1, padding: "20px 12px", overflowY: "auto" }}>
        {NAV.filter(n => {
          if (["users", "permissions"].includes(n.id)) {
            return currentUser?.role === "admin";
          }
          return true;
        }).map(n => (
          <div key={n.id}>
            {n.section && (
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: C.amber,
                padding: "24px 0px 8px",
              }}>{n.section}</div>
            )}
            <button
              onClick={() => setActive(n.id)}
              style={{
                display: "flex", alignItems: "center", gap: isCollapsed ? 0 : 12,
                width: "100%", padding: isCollapsed ? "12px" : "12px 16px", borderRadius: "12px",
                border: "none", background: active === n.id ? "rgba(255, 255, 255, 0.12)" : "transparent",
                color: active === n.id ? "#fff" : "rgba(255,255,255,0.7)",
                fontFamily: "inherit", fontSize: 14, fontWeight: active === n.id ? 600 : 500,
                cursor: "pointer", marginBottom: 6, transition: "background 0.2s, color 0.2s, transform 0.2s",
                borderLeft: active === n.id ? `4px solid ${C.amber}` : "4px solid transparent",
                transform: active === n.id && !isCollapsed ? "translateX(4px)" : "none",
                justifyContent: isCollapsed ? "center" : "flex-start",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = active === n.id ? "rgba(255, 255, 255, 0.18)" : "rgba(255,255,255,0.08)"; !isCollapsed && (e.currentTarget.style.transform = "translateX(4px)"); }}
              onMouseLeave={e => { e.currentTarget.style.background = active === n.id ? "rgba(255, 255, 255, 0.12)" : "transparent"; e.currentTarget.style.transform = active === n.id && !isCollapsed ? "translateX(4px)" : "none"; }}
              title={isCollapsed ? n.label : ""}
            >
              <Icon name={n.icon} size={18} style={{ flexShrink: 0 }} color={active === n.id ? C.amber : "rgba(255,255,255,0.5)"} />
              {!isCollapsed && n.label}
            </button>

          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: isCollapsed ? "14px 6px" : "14px 10px", borderTop: "0.5px solid rgba(255,255,255,0.14)" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: isCollapsed ? "10px" : "10px 12px", marginBottom: 10,
          background: "rgba(255,255,255,0.08)", borderRadius: "18px",
          justifyContent: isCollapsed ? "center" : "flex-start",
        }}>
          <Avatar name={currentUser?.name || "?"} role={currentUser?.role || "viewer"} size={30} />
          {!isCollapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {currentUser?.name || "Admin"}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.75)" }}>
                {ROLE_META[currentUser?.role]?.label || "User"}
              </div>
            </div>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isCollapsed ? "1fr" : "1fr 1fr", gap: 8, marginBottom: 10 }}>
          <button
            onClick={() => !loading && onRefresh()}
            disabled={loading}
            title="Refresh data"
            className="sidebar-action-btn btn-refresh"
            style={{ opacity: loading ? 0.5 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          >
            <Icon name="RotateCw" size={14} className={loading ? "spin-btn-icon" : ""} />
            {!isCollapsed && (loading ? "Refreshing..." : "Refresh")}
          </button>
          <button onClick={onLogout} title="Sign out" className="sidebar-action-btn btn-logout">
            <Icon name="LogOut" size={14} />
            {!isCollapsed && "Logout"}
          </button>
        </div>
        {!isCollapsed && (
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", textAlign: "center" }}>
            <span style={{ color: C.green, marginRight: 6 }}>●</span> {onlineCount} online , {mobCount} MOBs
          </div>
        )}
      </div>
    </div>
  );
}
