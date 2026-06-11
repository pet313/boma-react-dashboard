import { useState, useEffect, useCallback, useMemo, useRef, Fragment } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import * as Lucide from "lucide-react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { mobsApi, usersApi, suppliersApi } from "./api";
import { C, ROLE_META, NAV, FALLBACK_INTAKE, FALLBACK_MONTHS, USER_ROLES, s } from "./utils/constants";
import { getInitials, extractArray, fmtWeight, fmtDate, fmtTimestamp, getMobLivestockCount, getMobLocation } from "./utils/helpers";
import kmclogo from './assets/kmclogo.jpg'
import kmcslogan from './assets/kmcslogan.png'

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function Icon({ name, size = 18, color, style, className, strokeWidth = 2 }) {
  const LucideIcon = Lucide[name];
  if (!LucideIcon) return null;
  return <LucideIcon size={size} color={color} style={style} className={className} strokeWidth={strokeWidth} />;
}

function Chip({ text, color = "gray" }) {
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

function KPI({ label, value, sub, subColor, icon, theme = "blue", loading }) {
  if (loading) {
    return (
      <div style={{ ...s.metric, background: "var(--color-background-secondary)", display: "flex", flexDirection: "column", gap: 10, alignItems: "center", justifyContent: "center", minHeight: 110 }}>
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

  const valStr = String(value);
  const numericPart = valStr.replace(/,/g, '').match(/[\d.]+/);
  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    if (!numericPart) return;
    const target = parseFloat(numericPart[0]);
    let start = 0;
    const duration = 1000;
    const stepTime = 20;
    const increment = target / (duration / stepTime);

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setDisplayVal(target);
        clearInterval(timer);
      } else {
        setDisplayVal(start);
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [value]);

  const getDisplay = () => {
    if (!numericPart) return valStr;
    const isInt = !valStr.includes(".");
    const suffix = valStr.split(/[\d.,]+/)[1] || "";
    const formatted = isInt ? Math.floor(displayVal).toLocaleString() : displayVal.toFixed(1);
    return `${formatted}${suffix}`;
  };

  return (
    <div
      className="kpi-card"
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-6px) scale(1.03)";
        e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0) scale(1)";
        e.currentTarget.style.boxShadow = s.metric.boxShadow;
      }}
      style={{
        ...s.metric, background: themes[theme], display: "flex", flexDirection: "column",
        gap: 4, alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: 110,
        cursor: "default"
      }}
    >
      <style>{`
        @keyframes sweep {
          0% { left: -110%; opacity: 0; }
          50% { opacity: 1; }
          100% { left: 120%; opacity: 0; }
        }
        .kpi-card:hover .sweep-light { animation: sweep 0.85s ease-in-out; }
      `}</style>
      <div className="sweep-light" style={{
        position: "absolute", top: 0, width: "40%", height: "100%",
        background: "linear-gradient(to right, transparent, rgba(255,255,255,0.25), transparent)",
        transform: "skewX(-25deg)", pointerEvents: "none", left: "-110%", opacity: 0
      }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
        {icon && <Icon name={icon} size={18} color="rgba(255,255,255,0.5)" />}
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</span>
      </div>
      <div style={{ fontSize: 34, fontWeight: 800, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
        {getDisplay()}
      </div>
      {sub && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}

function Btn({ children, onClick, variant = "default", disabled, locked, loading, small, icon, className, style: sx = {} }) {
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
    ghost:   { background: "transparent", color: C.blue, border: `0.5px solid ${C.blue}` },
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

function Avatar({ name, role, size = 34 }) {
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

function Toggle({ on, onChange, disabled }) {
  return (
    <div onClick={() => !disabled && onChange(!on)} style={{
      width: 38, height: 22, borderRadius: 11, cursor: disabled ? "not-allowed" : "pointer",
      background: on ? C.green : "var(--color-border-secondary)",
      position: "relative", transition: "background .2s", flexShrink: 0,
    }}>
      <div style={{
        position: "absolute", top: 3, left: on ? 19 : 3,
        width: 16, height: 16, borderRadius: "50%", background: "#fff",
        transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </div>
  );
}

function THead({ cols }) {
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

function TD({ children, mono, center, style: sx }) {
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

function DataTable({ cols, rows, empty = "No data available." }) {
  return (
    <div style={{ 
      overflowX: "auto", 
      borderRadius: "var(--border-radius-md)", 
      border: "1px solid var(--color-border-tertiary)",
      background: "var(--color-background-primary)"
    }}>
      <style>{`
        .modern-table tbody tr { transition: background 0.15s ease; }
        .modern-table tbody tr:hover { background-color: var(--color-background-secondary); }
        .modern-table tbody tr:last-child td { border-bottom: none; }
      `}</style>
      <table className="modern-table" style={{ width: "100%", borderCollapse: "collapse" }}>
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

function Modal({ title, children, onClose, wide }) {
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.45)", display: "flex",
        alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div style={{
        background: "var(--color-background-primary)",
        borderRadius: "var(--border-radius-lg)",
        border: "0.5px solid var(--color-border-tertiary)",
        width: wide ? 640 : 440, maxHeight: "90vh",
        overflow: "hidden", display: "flex", flexDirection: "column",
      }}>
        <div style={{
          padding: "16px 20px", borderBottom: "0.5px solid var(--color-border-tertiary)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontWeight: 500, fontSize: 15 }}>{title}</span>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--color-text-secondary)", fontSize: 20, lineHeight: 1,
          }}>
            <Icon name="X" size={20} />
          </button>
        </div>
        <div style={{ padding: "20px", overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

function FormField({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 5 }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 3 }}>{hint}</div>}
    </div>
  );
}

function Toast({ msg, type }) {
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

// ─────────────────────────────────────────────────────────────────────────────
// PRINT GRN (opens a real print window)
// ─────────────────────────────────────────────────────────────────────────────

function printGRN(grnData, mob) {
  const w = window.open("", "_blank");
  if (!w) return alert("Allow popups to print GRN");
  const data = grnData || mob;
  const animals = data.livestock || [];
  const supplier = data.supplier || mob.supplier || {};
  const officer = data.officer || mob.officer || {};
  
  // Constructing data string for digital verification
  const qrData = [
    `GRN: ${data.grn_number || mob.grn_number || 'PENDING'}`,
    `MOB: ${data.mob_number || mob.mob_number || 'N/A'}`,
    `Supplier: ${supplier.name || 'N/A'}`,
    `Farmer No: ${supplier.farmer_no || 'N/A'}`,
    `Weight: ${Number(data.total_weight || mob.total_weight || 0).toFixed(3)} KG`,
    `Value: KES ${Number(data.total_amount || mob.total_amount || 0).toLocaleString()}`,
    `Date: ${new Date().toLocaleString('en-GB')}`
  ].join(' | ');
  
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>GRN - ${data.grn_number || mob.grn_number || 'PENDING'}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 10pt; color: #1a1a1a; position: relative; line-height: 1.4; }
  .page { padding: 15mm 15mm 10mm 15mm; position: relative; z-index: 1; }

  .watermark {
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    opacity: 0.05; z-index: 0; width: 450px; pointer-events: none;
  }

  /* Header */
  .header-line { 
    display: flex; justify-content: space-between; align-items: center; 
    border-bottom: 2.5px solid #003893; padding-bottom: 12px; margin-bottom: 15px;
    padding-top: 8px;
  }
  .logo-section { display: flex; align-items: center; gap: 15px; }
  .logo-img { height: 60px; width: auto; border-radius: 8px; }
  .address-section { display: flex; gap: 40px; flex: 1; justify-content: center; font-size: 14pt; line-height: 1.5; color: #2c3e50; text-align: center; }
  .address-item { padding-right: 0; }
  .address-item:last-child { border-right: none; padding-right: 0; }
  .address-item strong { color: #003893; }

  .title-section { text-align: center; margin: 15px 0; padding: 8px 0; }
  .title-section h1 { font-size: 18pt; font-weight: 900; color: #003893; margin: 0; letter-spacing: 1px; }
  .title-section h2 { font-size: 11pt; font-weight: 700; color: #C8102E; margin-top: 2px; }

  /* Copy label */
  .copy-label { text-align: center; font-weight: 800; font-size: 10pt; color: #C8102E; background: #fdf2f2; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 2px; padding: 8px 0; border: 1px solid #f8d7da; border-radius: 4px; }

  /* Meta grid */
  .meta-grid { display: flex; gap: 12px; margin: 15px 0; }
  .supplier-box { flex: 1.3; border: 1px solid #000; background: #fcfcfc; padding: 12px; font-size: 9.5pt; line-height: 1.5; }
  .supplier-box strong { color: #C8102E; }
  .ref-box { flex: 1; font-size: 9.5pt; }
  .ref-row { display: flex; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid #f0f0f0; }
  .ref-label { font-weight: 700; width: 32mm; color: #003893; }
  .ref-value { flex: 1; padding: 0 2mm; font-weight: 600; }

  /* Table */
  table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 9pt; }
  th { background: #f0f4ff; color: #003893; padding: 14px 10px; font-weight: 800; text-transform: uppercase; font-size: 8.5pt; text-align: left; border: 1px solid #000; letter-spacing: 0.5px; }
  td { border: 1px solid #000; padding: 16px 10px; }
  tbody tr:nth-child(even) { background: #fbfbfb; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }

  .totals { margin-top: 10px; }
  .total-row { display: flex; justify-content: flex-end; gap: 12px; font-size: 11pt; font-weight: 900; margin-top: 5px; padding: 10px 8px; color: #003893; }
  .total-val { width: 40mm; text-align: right; padding-right: 2px; border-bottom: 2px solid #003893; }

  .sig-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 30px; }
  .sig-box { border: 1px solid #000; padding: 10px; height: 85px; font-size: 8.5pt; display: flex; flex-direction: column; justify-content: space-between; }
  .sig-label { font-weight: 700; color: #003893; text-transform: uppercase; font-size: 7.5pt; }
  .footer { margin-top: 40px; font-size: 8pt; border-top: 1px solid #003893; padding-top: 8px; display: flex; justify-content: space-between; color: #666; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <img src="${kmclogo}" class="watermark" />
  <div class="page">
    <div class="header-line">
      <div class="logo-section">
        <img src="${kmclogo}" class="logo-img" />
      </div>
      <div class="address-section">
        <div class="address-item"><strong>Headquarters</strong><br>P.O Box 2-00204, Athi River<br>+254 45 6626041</div>
        <div class="address-item"><strong>Nairobi Depot</strong><br>P.O.Box 30414-00100<br>+254 20 2013426</div>
        <div class="address-item"><strong>Mombasa Branch</strong><br>P.O Box 87080-80100<br>+254 20 3542623</div>
      </div>
    </div>

    <div class="title-section">
      <h1>KENYA MEAT COMMISSION</h1>
      <h2>GOODS RECEIVED NOTE</h2>
    </div>

    <div class="copy-label">SUPPLIER'S COPY</div>

    <div class="meta-grid">
      <div class="supplier-box">
        <strong>SUPPLIER DETAILS:</strong><br>
        Name: ${((supplier.name) || 'N/A').toUpperCase()}<br>
        Farmer No: ${supplier.farmer_no || 'N/A'}<br>
        ID Number: ${supplier.id_number || 'N/A'}<br>
        Phone No: ${supplier.phone || 'N/A'}
      </div>
      <div class="ref-box">
        <div class="ref-row"><span class="ref-label">MOB Number:</span><span class="ref-value">${data.mob_number || mob.mob_number || 'N/A'}</span></div>
        <div class="ref-row"><span class="ref-label">Location:</span><span class="ref-value">${getMobLocation(data) || getMobLocation(mob)}</span></div>
        <div class="ref-row"><span class="ref-label">Officer:</span><span class="ref-value">${officer.name || 'N/A'}</span></div>
        <div class="ref-row"><span class="ref-label">Order No:</span><span class="ref-value">${data.order_no || 'N/A'}</span></div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 8%">#</th>
          <th style="width: 18%">Tag / Unit Code</th>
          <th>Item Description</th>
          <th style="width: 15%" class="text-right">Weight (KG)</th>
          <th style="width: 18%" class="text-right">Value (KES)</th>
        </tr>
      </thead>
      <tbody>
        ${animals.map((a, i) => `
          <tr>
            <td class="text-center">${a.item_no || i + 1}</td>
            <td class="text-center">${a.unit_code || a.livestock_number || 'N/A'}</td>
            <td>${a.item_description || 'Livestock Entry'}</td>
            <td class="text-right">${Number(a.weight || a.qty || 0).toFixed(3)}</td>
            <td class="text-right">${Number(a.value || (a.weight * (a.unit_price || 0)) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
          </tr>
        `).join('')}
        ${animals.length === 0 ? '<tr><td colspan="6" class="text-center">No livestock records attached</td></tr>' : ''}
      </tbody>
    </table>

    <div class="totals">
      <div class="total-row">
        <span>TOTAL WEIGHT:</span>
        <span class="total-val">${Number(data.total_weight || mob.total_weight || 0).toFixed(3)} KG</span>
      </div>
      <div class="total-row">
        <span>TOTAL AMOUNT:</span>
        <span class="total-val">KES ${Number(data.total_amount || mob.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      </div>
    </div>

    <div class="sig-grid">
      <div class="sig-box"><span class="sig-label">Received By (Measuring Officer):</span><span>Sign/Date: ________________</span></div>
      <div class="sig-box"><span class="sig-label">Verified By (Audit/Accounts):</span><span>Sign/Date: ________________</span></div>
      <div class="sig-box"><span class="sig-label">Supplier Signature:</span><span>Sign/Date: ________________</span></div>
    </div>

    <div style="display: flex; justify-content: center; margin-top: 25px;">
      <div style="text-align: center;">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(qrData)}" style="width: 90px; height: 90px;" alt="QR Code" />
        <div style="font-size: 7.5pt; margin-top: 5px; color: #666; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Scan for Digital Verification</div>
      </div>
    </div>

    <div class="footer">
      <span>System GRN Reference: ${data.grn_number || 'PENDING'}</span>
      <span>Printed: ${new Date().toLocaleString('en-GB')}</span>
      <span>LTS Dashboard v3.0</span>
    </div>
  </div>
  <script>window.onload = () => { window.print(); }</script>
</body></html>`;
  w.document.write(html);
  w.document.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────

function Sidebar({ active, setActive, currentUser, onLogout, onRefresh, onlineCount, mobCount, isCollapsed, setIsCollapsed }) {
  return (
    <div className="sidebar-container" style={{
      display: "flex", flexDirection: "column",
      background: "var(--color-sidebar-bg)",
      backdropFilter: "var(--color-sidebar-blur)",
      WebkitBackdropFilter: "var(--color-sidebar-blur)",
      color: "#fff", height: "100vh",
      position: "sticky", top: 0,
      boxShadow: "8px 0 32px rgba(0, 0, 0, 0.25)",
      borderTop: `4px solid ${C.red}`,
    }}>
      <style>{`
        .sidebar-nav::-webkit-scrollbar { display: none; }
        .sidebar-nav { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      {/* Logo */}
      <div style={{ padding: "28px 24px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <div style={{ position: "relative", width: 34, height: 34 }}>
             <img 
      src={kmclogo} 
      alt="KMC Logo" 
      style={{ width: 34, height: 34, borderRadius: 10,justifyContent: "center",
            boxShadow: `0 4px 12px ${C.red}40`, }} 
     />
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 16, lineHeight: 1.2, letterSpacing: "-0.02em" }}>KENYA MEAT COMMISSION</div>
            <div style={{ color: "hsl(41, 100%, 53%)", fontSize: 13 }}>Boma Dashboard</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav" style={{ flex: 1, padding: "20px 12px", overflowY: "auto" }}>
        {NAV.filter(n => {
          // Hide Administration section from non-admins
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
                padding: "24px 12px 8px",
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
        <style>{`
          .sidebar-action-btn {
            display: flex; align-items: center; justify-content: center; gap: 8;
            padding: 10px 0; border-radius: 12px;
            background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
            color: #fff; cursor: pointer; font-size: 13px; font-weight: 500;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .sidebar-action-btn:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.2); transform: translateY(-1px); }
          .btn-refresh:hover { color: #fff; background: ${C.green}; border-color: ${C.green}; }
          .btn-logout:hover { color: #fff; background: ${C.red}; border-color: ${C.red}; }
        `}</style>
        <div style={{ display: "grid", gridTemplateColumns: isCollapsed ? "1fr" : "1fr 1fr", gap: 8, marginBottom: 10 }}>
          <button onClick={onRefresh} title="Refresh data" className="sidebar-action-btn btn-refresh">
            <Icon name="RotateCw" size={14} />
            {!isCollapsed && "Refresh"}
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

// ─────────────────────────────────────────────────────────────────────────────
// TOPBAR
// ─────────────────────────────────────────────────────────────────────────────

function TopBar({ active, onRefresh, theme, setTheme }) {
  const nav = NAV.find(n => n.id === active);
  return (
    <div style={{
      padding: "14px 24px",
      background: "var(--color-background-primary)",
      borderBottom: "0.5px solid var(--color-border-tertiary)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {nav && <Icon name={nav.icon} size={18} color={C.blue} />}
        <span style={{ fontSize: 16, fontWeight: 500 }}>{nav?.label || ""}</span>
      </div>
      <div style={{ margin: "auto 0", display: "flex", alignItems: "center", width: 200, height: 50 }}>
             <img 
      src={kmcslogan} 
      alt="KMC slogan" 
      style={{ width: 200, height: 50, borderRadius: 10,justifyContent: "center",
             }} 
     />
          </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
        <Btn onClick={onRefresh} variant="default" small icon="RotateCw">Refresh</Btn>
        
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

function LoginPage({ theme, setTheme }) {
  const { login } = useAuth();
  const [eid, setEid] = useState("");
  const [pw, setPw]   = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const isValid = eid.trim() && pw;

  const go = async () => {
    if (!eid || !pw) return setErr("Employee ID and password are required.");
    setBusy(true); setErr("");
    try { await login(eid.trim(), pw); }
    catch (e) { setErr("Invalid employee ID or password. If you have forgotten your credentials, please contact the system administrator for assistance."); }
    finally { setBusy(false); }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center",
      background: "var(--color-background-tertiary)",
      position: "relative", overflow: "hidden"
    }}>
      <div style={{ position: "absolute", top: 24, right: 24, zIndex: 10 }}>
        <Btn onClick={() => setTheme(theme === "light" ? "dark" : "light")} variant="default" icon={theme === "light" ? "Moon" : "Sun"}>
          {theme === "light" ? "Dark Mode" : "Light Mode"}
        </Btn>
      </div>

      <style>{`
        @keyframes loginEntrance {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes floating {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes btnPulse {
          0% { box-shadow: 0 0 0 0 rgba(53, 184, 37, 0.6); }
          70% { box-shadow: 0 0 0 12px rgba(53, 184, 37, 0); }
          100% { box-shadow: 0 0 0 0 rgba(53, 184, 37, 0); }
        }
        .login-card { animation: loginEntrance 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards, floating 5s ease-in-out infinite 0.8s; }
        .btn-pulse { animation: btnPulse 2s infinite; }
        .login-input-group input {
          width: 100%; padding: 12px 14px; border-radius: 12px;
          border: 1px solid var(--color-border-secondary);
          background: var(--color-background-primary);
          color: var(--color-text-primary); transition: all 0.2s ease;
        }
        .login-input-group input:focus {
          border-color: ${C.blue}; outline: none; box-shadow: 0 0 0 4px ${C.blue}15;
          background: var(--color-background-primary);
        }
        .login-card label { color: var(--color-text-secondary) !important; }
        .login-btn { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important; }
        .login-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, ${C.green} 0%, ${C.greenDark} 100%) !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(53, 184, 37, 0.4);
        }
        .login-btn:active:not(:disabled) { transform: translateY(0); }
      `}</style>

      <div className="login-card" style={{
        width: 420, 
        background: "var(--color-background-primary)",
        borderRadius: 28, overflow: "hidden",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
        position: "relative", zIndex: 1, border: "1px solid var(--color-border-tertiary)"
      }}>
        {/* Header stripe */}
        <div style={{ background: C.blueDark, padding: "48px 40px 36px", textAlign: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{
              
              display: "flex", alignItems: "center", justifyContent: "center",
              
            }}>
              <img
                src={kmclogo}
                alt="KMC Logo"
                style={{
                  width: 60, height: 60, borderRadius: 10, justifyContent: "center",
                  boxShadow: `0 4px 12px ${C.red}40`, border: "1px solid rgba(255, 0, 0, 0.2)"
                }}
              />
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 22, letterSpacing: "-0.02em" }}>Kenya Meat Commission</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 4 }}>Boma Dashboard</div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div style={{ padding: "40px" }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 6, color: "var(--color-text-primary)", display: 'flex', alignItems: 'center', gap: 8 }}> <Icon name="LogIn" size={20} color={C.blue} /> Sign In</div>
            <div style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>
              Welcome back! Please enter your credentials to login.
            </div>
          </div>

          <div className="login-input-group">
            <FormField label="Employee ID">
              <div style={{ position: "relative" }}>
                <Icon name="User" size={16} color="var(--color-text-tertiary)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  type="text" value={eid} placeholder="e.g 12345"
                  onChange={e => setEid(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && go()}
                  autoComplete="username"
                  style={{ paddingLeft: 40 }}
                />
              </div>
            </FormField>

            <FormField label="Password">
              <div style={{ position: "relative" }}>
                <Icon name="Lock" size={16} color="var(--color-text-tertiary)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  type="password" value={pw} placeholder="Type your password"
                  onChange={e => setPw(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && go()}
                  autoComplete="current-password"
                  style={{ paddingLeft: 40 }}
                />
              </div>
            </FormField>
          </div>

          {err && (
            <div style={{
              fontSize: 13, color: C.redDark, background: C.redBg,
              padding: "12px 16px", borderRadius: 12, marginBottom: 20,
              border: `1px solid ${C.red}25`, display: "flex", alignItems: "center", gap: 10
            }}>
              <Icon name="AlertCircle" size={16} /> {err}
            </div>
          )}

          <Btn variant="primary" onClick={go} loading={busy} className={`login-btn ${isValid && !busy ? "btn-pulse" : ""}`}
            style={{ width: "100%", justifyContent: "center", padding: "14px", borderRadius: 12, fontSize: 14 }}>
            {busy ? "Signing in..." : "Sign in to Dashboard"}
          </Btn>

          <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
            <img
              src={kmcslogan}
              alt="KMC mantra"
              style={{ width: 180, height: "auto" }}
            />
          </div>

        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OVERVIEW PAGE
// ─────────────────────────────────────────────────────────────────────────────

function OverviewPage({ mobs, chartData }) {
  const { intakeData = [], mobStatusData = [], emailStatusData = [], speciesCountData = [], weightData = [] } = chartData;
  const total = mobs.length;
  const open  = mobs.filter(m => m.mob_status === "OPEN").length;
  const livestockCount = mobs.reduce((s, m) => s + (getMobLivestockCount(m) || 0), 0);
  const failed  = mobs.filter(m => m.email_status === "FAILED").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={s.grid4}>
        <KPI label="Total MOBs"       value={total}   icon="ListTodo" sub="Live from backend" theme="blue" />
        <KPI label="Total Livestock"    value={livestockCount.toLocaleString()} icon="BarChart3" theme="amber" />
        <KPI label="Open MOBs"        value={open}    icon="LockOpen" sub="Accepting livestock" theme="green" />
        <KPI label="GRN Email Failures" value={failed} icon="MailX"
          sub={failed > 0 ? "Needs attention" : "All delivered"} theme="red" />
      </div>

      <div style={s.grid2}>
        <div style={s.card}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Monthly livestock intake</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={intakeData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }} />
              <YAxis tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }} />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: 8, background: "var(--color-background-primary)", 
                  border: "0.5px solid var(--color-border-tertiary)", fontSize: 12,
                  color: "var(--color-text-primary)" 
                }} itemStyle={{ color: "var(--color-text-primary)" }} />
              <Bar dataKey="livestock" fill={C.blue} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ ...s.card, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>MOB status</div>
            <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
              <PieChart width={120} height={120}>
                <Pie data={mobStatusData.length ? mobStatusData : [{ name: "No data", value: 1, color: "#eee" }]}
                  cx={56} cy={56} innerRadius={36} outerRadius={56} dataKey="value" strokeWidth={0}>
                  {(mobStatusData.length ? mobStatusData : [{ color: "#eee" }]).map((d, i) =>
                    <Cell key={i} fill={d.color} />)}
                </Pie>
              </PieChart>
              <div style={{
                position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", pointerEvents: "none",
              }}>
                <span style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text-primary)" }}>{total}</span>
                <span style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>MOBs</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
              {mobStatusData.map(d => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                  <span style={{ flex: 1, color: "var(--color-text-secondary)" }}>{d.name}</span>
                  <span style={{ fontWeight: 500 }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...s.card, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Email delivery</div>
            {emailStatusData.map(d => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, marginBottom: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                <span style={{ flex: 1, color: "var(--color-text-secondary)" }}>{d.name}</span>
                <span style={{ fontWeight: 500 }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={s.grid2}>
        <div style={s.card}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Species breakdown</div>
          {speciesCountData.length === 0
            ? <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", padding: "20px 0", textAlign: "center" }}>No species data yet</div>
            : speciesCountData.map(d => {
                const max = Math.max(...speciesCountData.map(x => x.value), 1);
                return (
                  <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ fontSize: 12, minWidth: 52, color: "var(--color-text-secondary)" }}>{d.name}</div>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--color-background-secondary)", overflow: "hidden" }}>
                      <div style={{ width: `${(d.value / max) * 100}%`, height: "100%", background: d.color, borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500, minWidth: 36, textAlign: "right" }}>{d.value.toLocaleString()}</div>
                  </div>
                );
              })
          }
        </div>

        <div style={s.card}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Weight distribution (KG)</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weightData} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" />
              <XAxis dataKey="band" tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }} />
              <YAxis tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }} />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: 8, background: "var(--color-background-primary)", 
                  border: "0.5px solid var(--color-border-tertiary)", fontSize: 12,
                  color: "var(--color-text-primary)" 
                }} itemStyle={{ color: "var(--color-text-primary)" }} />
              <Bar dataKey="count" fill={C.purple} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {failed > 0 && (
        <div style={{
          background: C.amberBg, color: C.amberDark, borderRadius: "var(--border-radius-md)",
          padding: "12px 16px", fontSize: 13, display: "flex", alignItems: "center", gap: 10,
          border: `0.5px solid ${C.amber}`,
        }}>
          <Icon name="AlertTriangle" size={16} />
          {failed} GRN email{failed !== 1 ? "s" : ""} failed delivery. Go to GRN & Emails to retry or resend.
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GRN & EMAILS PAGE — print + resend
// ─────────────────────────────────────────────────────────────────────────────

function GrnPage({ mobs, toast, currentUser }) {
  const [filter, setFilter]       = useState("all");
  const [busy, setBusy]           = useState({});
  const [grnModal, setGrnModal]   = useState(null);
  const [loadingGrn, setLoadingGrn] = useState({});

  const filtered = mobs.filter(m => {
    if (filter === "failed")  return m.email_status === "FAILED";
    if (filter === "sent")    return m.email_status === "SENT";
    if (filter === "pending") return m.email_status === "PENDING";
    if (filter === "closed")  return m.mob_status === "CLOSED";
    return m.mob_status === "CLOSED"; // default: all closed mobs
  });

  const handleRetry = async mob => {
    setBusy(b => ({ ...b, [mob.id]: "retry" }));
    try {
      await mobsApi.retryEmail(mob.id, { force: true });
      toast("Email resent successfully to " + (mob.supplier?.name || mob.id), "success");
    } catch (e) {
      toast("Retry failed: " + e.message, "error");
    } finally {
      setBusy(b => ({ ...b, [mob.id]: null }));
    }
  };

  const handlePrint = async mob => {
    setLoadingGrn(l => ({ ...l, [mob.id]: true }));
    try {
      const data = await mobsApi.getGrnData(mob.id);
      printGRN(data, mob);
    } catch {
      printGRN(null, mob); // fallback to local data
    } finally {
      setLoadingGrn(l => ({ ...l, [mob.id]: false }));
    }
  };

  const handlePreview = async mob => {
    setLoadingGrn(l => ({ ...l, [mob.id]: true }));
    try {
      const data = await mobsApi.getGrnData(mob.id);
      setGrnModal({ data, mob });
    } catch {
      setGrnModal({ data: null, mob });
    } finally {
      setLoadingGrn(l => ({ ...l, [mob.id]: false }));
    }
  };

  const closedMobs = mobs.filter(m => m.mob_status === "CLOSED");
  const sentCount    = closedMobs.filter(m => m.email_status === "SENT").length;
  const failedCount  = closedMobs.filter(m => m.email_status === "FAILED").length;
  const pendingCount = closedMobs.filter(m => m.email_status === "PENDING").length;

  const canPrint  = ["admin", "officer", "accounts"].includes(currentUser?.role);
  const canResend = ["admin", "accounts"].includes(currentUser?.role);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={s.grid4}>
        <KPI label="GRNs generated"  value={closedMobs.length} icon="FileBadge" theme="black" />
        <KPI label="Email sent"      value={sentCount}    icon="MailCheck"  sub={`${closedMobs.length ? Math.round(sentCount/closedMobs.length*100) : 0}% success`} theme="green" />
        <KPI label="Email failed"    value={failedCount}  icon="MailX"    sub={failedCount > 0 ? "Needs retry" : "All clear"} theme="red" />
        <KPI label="Pending send"    value={pendingCount} icon="MailPlus" theme="amber" />
      </div>

      {/* Filter chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          { k: "all",     label: "All closed MOBs", count: closedMobs.length },
          { k: "failed",  label: "Failed",          count: failedCount,  color: "red"   },
          { k: "sent",    label: "Sent",             count: sentCount,    color: "green" },
          { k: "pending", label: "Pending",          count: pendingCount, color: "amber" },
        ].map(f => (
          <button key={f.k} onClick={() => setFilter(f.k)} style={{
            padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
            border: `0.5px solid ${filter === f.k ? C.blue : "var(--color-border-secondary)"}`,
            background: filter === f.k ? C.blueBg : "var(--color-background-primary)",
            color: filter === f.k ? C.blueDark : "var(--color-text-secondary)",
            cursor: "pointer",
          }}>
            {f.label} <span style={{ opacity: 0.6 }}>({f.count})</span>
          </button>
        ))}
      </div>

      <div style={s.card}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>
          GRN records — {filtered.length} {filter === "all" ? "closed MOBs" : filter}
        </div>
        <DataTable
          cols={["MOB No.", "Supplier", "GRN Number", "Livestock", "Weight", "Email status", "Actions"]}
          empty="No GRN records match this filter."
          rows={filtered.map(m => (
            <tr key={m.id} style={{ cursor: "default" }}>
              <TD mono>{m.mob_number || m.id}</TD>
              <TD>{m.supplier?.name || "None"}</TD>
              <TD mono style={{ fontSize: 11 }}>{m.grn_number || "None"}</TD>
              <TD>{getMobLivestockCount(m) ?? "None"}</TD>
              <TD>{Number(m.total_weight || 0).toFixed(3)} KG</TD>
              <TD>
                {m.email_status === "SENT"    && <Chip text="✓ Sent"    color="green" />}
                {m.email_status === "FAILED"  && <Chip text="✗ Failed"  color="red"   />}
                {m.email_status === "PENDING" && <Chip text="Pending"   color="amber" />}
                {!m.email_status              && <span style={{ color: "var(--color-text-tertiary)" }}>None</span>}
              </TD>
              <TD>
                <div style={{ display: "flex", gap: 6 }}>
                  <Btn small icon="Eye" onClick={() => handlePreview(m)} loading={loadingGrn[m.id]}>
                    {loadingGrn[m.id] ? "…" : "Preview"}
                  </Btn>
                  <Btn small icon="Printer" variant="ghost" onClick={() => handlePrint(m)} disabled={loadingGrn[m.id]}>
                    Print
                  </Btn>
                  {currentUser?.role === "admin" && (
                    <Btn small icon="Send" variant="success" onClick={() => handleRetry(m)} loading={busy[m.id] === "retry"}>
                      {busy[m.id] === "retry" ? "Sending…" : "Resend"}
                    </Btn>
                  )}
                </div>
              </TD>
            </tr>
          ))}
        />
      </div>

      {/* GRN Preview Modal */}
      {grnModal && (
        <Modal title={`GRN Preview — ${grnModal.mob.grn_number || grnModal.mob.mob_number}`} wide onClose={() => setGrnModal(null)}>
          <GrnPreview data={grnModal.data} mob={grnModal.mob} />
          <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
            <Btn icon="Printer" variant="primary" onClick={() => { printGRN(grnModal.data, grnModal.mob); }} locked={!canPrint}>
              Print GRN
            </Btn>
            <Btn icon="Send" variant="success" onClick={() => { handleRetry(grnModal.mob); setGrnModal(null); }} locked={!canResend} loading={busy[grnModal.mob.id] === "retry"}>
              Resend Email
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function GrnPreview({ data, mob }) {
  const d = data || mob;
  const animals = d?.livestock || [];
  const supplier = d?.supplier || mob.supplier || {};
  const officer = d?.officer || mob.officer || {};

  const qrData = [
    `GRN: ${d?.grn_number || mob.grn_number || 'PENDING'}`,
    `MOB: ${d?.mob_number || mob.mob_number || 'N/A'}`,
    `Supplier: ${supplier.name || 'N/A'}`,
    `Farmer No: ${supplier.farmer_no || 'N/A'}`,
    `Weight: ${Number(d?.total_weight || mob.total_weight || 0).toFixed(3)} KG`,
    `Value: KES ${Number(d?.total_amount || mob.total_amount || 0).toLocaleString()}`,
    `Date: ${new Date().toLocaleString('en-GB')}`
  ].join(' | ');

  return (
    <div style={{ fontSize: 13, fontFamily: "'Segoe UI', Roboto, sans-serif", background: "var(--color-background-secondary)", padding: 16, borderRadius: "var(--border-radius-lg)" }}>
      {/* Header with logo */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2.5px solid #003893", paddingBottom: 12, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src={kmclogo} alt="KMC Logo" style={{ height: 50, width: "auto", borderRadius: 8 }} />
        </div>
        <div style={{ display: "flex", gap: 40, fontSize: 16, lineHeight: 1.5, textAlign: "center", flex: 1, justifyContent: "center", color: '#2c3e50' }}>
          <div style={{ paddingRight: 0 }}>
            <strong>Headquarters</strong><br/>P.O Box 2-00204<br/>+254 45 6626041
          </div>
          <div style={{ paddingRight: 0 }}>
            <strong>Nairobi Depot</strong><br/>P.O.Box 30414-00100<br/>+254 20 2013426
          </div>
          <div>
            <strong>Mombasa Branch</strong><br/>P.O Box 87080-80100<br/>+254 20 3542623
          </div>
        </div>
      </div>

      {/* Title */}
      <div style={{ textAlign: "center", padding: "10px 0", marginBottom: 16 }}>
        <div style={{ fontSize: 19, fontWeight: 900, color: "#003893", margin: 0 }}>KENYA MEAT COMMISSION</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#C8102E", marginTop: 4 }}>GOODS RECEIVED NOTE - {d?.grn_number || mob.grn_number || "PENDING"}</div>
      </div>

      {/* Copy Label */}
      <div style={{ textAlign: "center", fontWeight: 800, fontSize: 10, color: "#C8102E", background: "#f0f4ff", marginBottom: 12, textTransform: "uppercase", letterSpacing: "1.5px", padding: "6px 0", borderRadius: 4, border: '1px solid #d0dfff' }}>
        SUPPLIER'S COPY
      </div>

      {/* Supplier & Reference Details */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 12, marginBottom: 12 }}>
        <div style={{ border: "1px solid #000", background: '#fcfcfc', padding: 12, borderRadius: 2 }}>
          <div style={{ fontWeight: 700, color: "#C8102E", marginBottom: 6 }}>SUPPLIER DETAILS:</div>
          <div style={{ fontSize: 12, lineHeight: 1.6 }}>
            <div>Name: <span style={{ fontWeight: 600 }}>{(supplier.name || "N/A").toUpperCase()}</span></div>
            <div>Farmer No: <span style={{ fontWeight: 600 }}>{supplier.farmer_no || "N/A"}</span></div>
            <div>ID Number: <span style={{ fontWeight: 600 }}>{supplier.id_number || "N/A"}</span></div>
            <div>Phone No: <span style={{ fontWeight: 600 }}>{supplier.phone || "N/A"}</span></div>
          </div>
        </div>

        <div style={{ fontSize: 12 }}>
          {[
            ["MOB Number", d?.mob_number || mob.mob_number],
            ["Location", getMobLocation(d) || getMobLocation(mob)],
            ["Officer", officer.name],
            ["Date Received", d?.received_date || fmtDate(mob.received_date)],
          ].map(([l, v]) => (
            <div key={l} style={{ display: "flex", padding: "5px 0", borderBottom: "1px solid #eee", marginBottom: 3 }}>
              <span style={{ fontWeight: 700, width: 90, color: "#003893" }}>{l}:</span>
              <span style={{ fontWeight: 500 }}>{v || "N/A"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Livestock Table */}
      <div style={{ background: '#fff', border: '1px solid #000', padding: "0", marginBottom: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#f0f4ff", color: "#003893" }}>
              {["#", "Tag / Unit Code", "Description", "Weight (KG)", "Value (KES)"].map(h => (
                <th key={h} style={{ padding: "14px 10px", textAlign: h === "Description" ? "left" : "right", fontWeight: 700, fontSize: 10, textTransform: 'uppercase', border: '1px solid #000' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {animals.slice(0, 10).map((a, i) => (
              <tr key={i} style={{ background: i % 2 !== 0 ? "#fbfbfb" : "transparent" }}>
                <td style={{ padding: "16px 10px", textAlign: "center", fontSize: 11, border: '1px solid #000' }}>{a.item_no || i + 1}</td>
                <td style={{ padding: "16px 10px", textAlign: "center", fontFamily: "monospace", fontSize: 10, border: '1px solid #000' }}>{a.unit_code || a.livestock_number || "N/A"}</td>
                <td style={{ padding: "16px 10px", fontSize: 11, border: '1px solid #000' }}>{a.item_description || "Livestock Entry"}</td>
                <td style={{ padding: "16px 10px", textAlign: "right", fontWeight: 500, border: '1px solid #000' }}>{Number(a.weight || a.qty || 0).toFixed(3)}</td>
                <td style={{ padding: "16px 10px", textAlign: "right", fontWeight: 600, border: '1px solid #000' }}>{Number(a.value || (a.weight * (a.unit_price || 0)) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: 800, background: '#f0f4ff', color: '#003893' }}>
              <td colSpan={3} style={{ padding: "12px 8px", border: '1px solid #000' }}>TOTAL : {animals.length} head</td>
              <td colSpan={2} style={{ padding: "12px 8px", textAlign: "right", border: '1px solid #000' }}>{Number(d?.total_weight || mob.total_weight || 0).toFixed(3)} KG</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Totals */}
      <div style={{ padding: "12px", marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, fontSize: 13, fontWeight: 800, color: '#003893' }}>
          <span>TOTAL WEIGHT:</span>
          <span style={{ minWidth: 100, textAlign: "right", borderBottom: '2px solid #003893' }}>{Number(d?.total_weight || mob.total_weight || 0).toFixed(3)} KG</span>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, fontSize: 13, fontWeight: 800, color: '#003893', marginTop: 8 }}>
          <span>TOTAL AMOUNT:</span>
          <span style={{ minWidth: 100, textAlign: "right", borderBottom: '2px solid #003893' }}>KES {Number(d?.total_amount || mob.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Signature Boxes */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 12 }}>
        {[
          "Received By (Measuring Officer)",
          "Verified By (Livestock Manager)",
          "Supplier Signature",
        ].map((label, i) => (
          <div key={i} style={{ border: "1px solid #000", padding: "10px", height: 85, display: "flex", flexDirection: "column", justifyContent: "space-between", background: '#fff' }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: "#003893", textTransform: 'uppercase' }}>{label}:</span>
            <div style={{ fontSize: 10, color: "#666" }}>Sign: _________________</div>
          </div>
        ))}
      </div>

      {/* QR Code Section */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
        <div style={{ textAlign: "center" }}>
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(qrData)}`} style={{ width: 80, height: 80 }} alt="QR Verification" />
          <div style={{ fontSize: 9, marginTop: 4, color: "var(--color-text-tertiary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Scan for Digital Verification</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 12, paddingTop: 8, borderTop: "1px solid #eee", display: "flex", justifyContent: "space-between", fontSize: 10, color: "#888" }}>
        <span>Ref: {d?.grn_number || "PENDING"}</span>
        <span>Generated: {new Date().toLocaleString("en-GB")}</span>
      
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MOBS PAGE
// ─────────────────────────────────────────────────────────────────────────────

function MobsPage({ mobs, chartData, loading }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { mobTrendData = [], dailyTrendData = [], dailyStats = {} } = chartData;

  const filtered = useMemo(() => {
    if (!startDate && !endDate) return mobs;
    return mobs.filter(m => {
      const timestamp = new Date(m.created_at || m.received_date).getTime();
      if (startDate && timestamp < new Date(startDate).getTime()) return false;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (timestamp > end.getTime()) return false;
      }
      return true;
    });
  }, [mobs, startDate, endDate]);

  const open   = filtered.filter(m => m.mob_status === "OPEN");
  const closed = filtered.filter(m => m.mob_status === "CLOSED");
  const livestockCount = filtered.reduce((s, m) => s + (getMobLivestockCount(m) || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ ...s.row, justifyContent: "space-between", flexWrap: "wrap" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="Calendar" color={C.blue} size={18} />
          Today's Pulse
        </div>
        
        <div style={{ ...s.row, background: "var(--color-background-primary)", padding: "4px 12px", borderRadius: 12, border: "0.5px solid var(--color-border-tertiary)", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase" }}>From</span>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} 
              style={{ border: "none", fontSize: 12, background: "transparent", color: "var(--color-text-primary)", outline: "none", cursor: "pointer" }} />
          </div>
          <div style={{ height: 16, width: 1, background: "var(--color-border-tertiary)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase" }}>To</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} 
              style={{ border: "none", fontSize: 12, background: "transparent", color: "var(--color-text-primary)", outline: "none", cursor: "pointer" }} />
          </div>
          {(startDate || endDate) && (
            <button onClick={() => { setStartDate(""); setEndDate(""); }} title="Clear filters"
              style={{ border: "none", background: "none", cursor: "pointer", color: C.red, display: "flex", alignItems: "center", padding: 0 }}>
              <Icon name="X" size={14} />
            </button>
          )}
        </div>
      </div>

      <div style={s.grid4}>
        <KPI label="Opened Today" value={dailyStats.openedToday || 0} icon="Plus" theme="blue" loading={loading} />
        <KPI label="Closed Today" value={dailyStats.closedToday || 0} icon="Lock" theme="green" loading={loading} />
        <KPI label="Livestock Today" value={dailyStats.livestockToday || 0} icon="BarChart3" theme="amber" loading={loading} />
        <KPI label="Active Field Staff" value={dailyStats.activeStaff || 0} icon="Users" theme="purple" loading={loading} />
      </div>

      <div style={{ height: 1, background: "var(--color-border-tertiary)", margin: "8px 0" }} />

      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: 8 }}>
        <Icon name="LineChart" color={C.blue} size={18} />
        Aggregated Analytics
      </div>
      <div style={s.grid4}>
        <KPI label="Total MOBs"   value={filtered.length}  icon="ListTodo" theme="purple" loading={loading} />
        <KPI label="Open MOBs"    value={open.length}   icon="LockOpen"    sub="Accepting livestock" theme="green" loading={loading} />
        <KPI label="Closed MOBs"  value={closed.length} icon="Lock"         sub="GRN generated" theme="blue" loading={loading} />
        <KPI label="Total Livestock" value={livestockCount.toLocaleString()} icon="BarChart3" theme="amber" loading={loading} />
      </div>

      <div style={s.grid2}>
        <div style={s.card}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Daily Activity (Last 7 Days)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyTrendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }} />
              <YAxis tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }} />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: 8, background: "var(--color-background-primary)", 
                  border: "0.5px solid var(--color-border-tertiary)", fontSize: 12,
                  color: "var(--color-text-primary)" 
                }} itemStyle={{ color: "var(--color-text-primary)" }} />
              <Bar dataKey="count" fill={C.amber} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={s.card}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>MOBs opened vs closed per month</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={mobTrendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }} />
              <YAxis tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }} />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: 8, background: "var(--color-background-primary)", 
                  border: "0.5px solid var(--color-border-tertiary)", fontSize: 12,
                  color: "var(--color-text-primary)" 
                }} itemStyle={{ color: "var(--color-text-primary)" }} />
              <Line type="monotone" dataKey="opened" stroke={C.blue}  dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="closed" stroke={C.green} dot={false} strokeWidth={2} strokeDasharray="4 3" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
            {[["Opened", C.blue], ["Closed", C.green]].map(([l, c]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--color-text-secondary)" }}>
                <div style={{ width: 10, height: 3, background: c, borderRadius: 2 }} />{l}
              </div>
            ))}
          </div>
        </div>

        <div style={s.card}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Recent activity</div>
          {loading ? Array(6).fill(0).map((_, i) => (
            <div key={`skel-act-${i}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
              <div className="skeleton-box" style={{ width: 8, height: 8, borderRadius: "50%" }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton-box" style={{ height: 10, width: "100px", marginBottom: 6 }} />
                <div className="skeleton-box" style={{ height: 8, width: "140px" }} />
              </div>
              <div className="skeleton-box" style={{ height: 18, width: "50px", borderRadius: 10 }} />
            </div>
          )) : mobs.slice(0, 6).map(m => (
            <div key={m.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 0", borderBottom: "0.5px solid var(--color-border-tertiary)",
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                background: m.mob_status === "OPEN" ? C.green : C.blue,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {m.mob_number}
                </div>
                <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
                  {m.supplier?.name || "None"} , {getMobLivestockCount(m) || 0} livestock
                </div>
              </div>
              <Chip text={m.mob_status} color={m.mob_status === "OPEN" ? "green" : "blue"} />
            </div>
          ))}
        </div>
      </div>

      <div style={s.card}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>MOB records : {filtered.length} found</div>
        <DataTable
          cols={["MOB No.", "Supplier", "Location", "Livestock", "Weight", "Status", "GRN Email"]}
          empty="No MOBs found."
          rows={loading ? Array(6).fill(0).map((_, i) => (
            <tr key={`skel-mob-${i}`}>
              <TD><div className="skeleton-box" style={{ height: 12, width: "70px" }} /></TD>
              <TD><div className="skeleton-box" style={{ height: 12, width: "120px" }} /></TD>
              <TD><div className="skeleton-box" style={{ height: 12, width: "90px" }} /></TD>
              <TD><div className="skeleton-box" style={{ height: 12, width: "30px" }} /></TD>
              <TD><div className="skeleton-box" style={{ height: 12, width: "60px" }} /></TD>
              <TD><div className="skeleton-box" style={{ height: 20, width: "60px", borderRadius: 20 }} /></TD>
              <TD><div className="skeleton-box" style={{ height: 20, width: "70px", borderRadius: 20 }} /></TD>
            </tr>
          )) : filtered.map(m => (
            <tr key={m.id}>
              <TD mono>{m.mob_number || m.id}</TD>
              <TD>{m.supplier?.name || "None"}</TD>
              <TD>{getMobLocation(m) || "None"}</TD>
              <TD>{getMobLivestockCount(m) ?? "None"}</TD>
              <TD>{Number(m.total_weight || 0).toFixed(3)} KG</TD>
              <TD><Chip text={m.mob_status || "None"} color={m.mob_status === "OPEN" ? "green" : "blue"} /></TD>
              <TD>
                {m.email_status === "SENT"    && <Chip text="Sent"    color="green" />}
                {m.email_status === "FAILED"  && <Chip text="Failed"  color="red" />}
                {m.email_status === "PENDING" && <Chip text="Pending" color="amber" />}
                {!m.email_status              && <span style={{ color: "var(--color-text-tertiary)" }}>None</span>}
              </TD>
            </tr>
          ))}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LIVESTOCK PAGE
// ─────────────────────────────────────────────────────────────────────────────

function LivestockPage({ livestock, chartData }) {
  const { speciesCountData = [], genderData = [] } = chartData;
  const total  = livestock.length;
  const manual = livestock.filter(a => a.manual_entry).length;
  const avgW   = total ? (livestock.reduce((s, a) => s + Number(a.weight || 0), 0) / total) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={s.grid4}>
        <KPI label="Total livestock"  value={total.toLocaleString()} icon="BarChart3" theme="blue" />
        <KPI label="Scale-weighed"  value={(total - manual).toLocaleString()} sub={`${total ? Math.round((total-manual)/total*100) : 0}%`} icon="Scale" theme="green" />
        <KPI label="Manual entries" value={manual.toLocaleString()} sub="Audit logged" theme="amber" icon="Edit3" />
        <KPI label="Avg weight"     value={`${avgW.toFixed(1)} KG`} icon="Weight" theme="purple" />
      </div>

      <div style={s.grid2}>
        <div style={s.card}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Livestock by species</div>
          {speciesCountData.length === 0
            ? <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", padding: "20px 0", textAlign: "center" }}>No data yet</div>
            : speciesCountData.map(d => {
                const max = Math.max(...speciesCountData.map(x => x.value), 1);
                return (
                  <div key={d.name} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: "var(--color-text-secondary)" }}>{d.name}</span>
                      <span style={{ fontWeight: 500 }}>{d.value.toLocaleString()}</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: "var(--color-background-secondary)", overflow: "hidden" }}>
                      <div style={{ width: `${(d.value / max) * 100}%`, height: "100%", background: d.color, borderRadius: 4 }} />
                    </div>
                  </div>
                );
              })
          }
        </div>

        <div style={s.card}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Gender split</div>
          <div style={{ position: "relative", display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <PieChart width={130} height={130}>
              <Pie data={genderData.length ? genderData : [{ name: "No data", value: 1, color: "#eee" }]}
                cx={62} cy={62} innerRadius={40} outerRadius={62} dataKey="value" strokeWidth={0}>
                {(genderData.length ? genderData : [{ color: "#eee" }]).map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
            </PieChart>
            <div style={{
              position: "absolute", inset: 0, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", pointerEvents: "none",
            }}>
              <span style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text-primary)" }}>{total.toLocaleString()}</span>
              <span style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>livestock</span>
            </div>
          </div>
          {genderData.map(d => (
            <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, marginBottom: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: d.color }} />
              <span style={{ flex: 1, color: "var(--color-text-secondary)" }}>{d.name}</span>
              <span style={{ fontWeight: 500 }}>{d.value?.toLocaleString()}</span>
              <span style={{ color: "var(--color-text-tertiary)", fontSize: 11 }}>
                ({total ? Math.round(d.value / total * 100) : 0}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// USERS PAGE with role management
// ─────────────────────────────────────────────────────────────────────────────

function AddUserModal({ onClose, onCreated, toast }) {
  const [form, setForm] = useState({ name: "", employee_id: "", email: "", role: "officer", location: "", password: "" });
  const [busy, setBusy] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.name || !form.employee_id || !form.password) return toast("Name, Employee ID and password are required.", "error");
    if (form.password.length < 8) return toast("Password must be at least 8 characters.", "error");
    setBusy(true);
    try {
      const user = await usersApi.create({
        name: form.name, employee_id: form.employee_id.toUpperCase().replace(/-/g, ""),
        email: form.email || null, role: form.role, location: form.location || null,
        password: form.password,
      });
      onCreated(user); onClose();
      toast("User created successfully.", "success");
    } catch (e) { toast(e.message, "error"); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormField label="Full name"><input value={form.name} onChange={set("name")} placeholder="e.g. John Kamau" /></FormField>
        <FormField label="Employee ID"><input value={form.employee_id} onChange={set("employee_id")} placeholder="e.g. KMCOFF002" /></FormField>
        <FormField label="Email address"><input type="email" value={form.email} onChange={set("email")} placeholder="john@kmc.go.ke" /></FormField>
        <FormField label="Location"><input value={form.location} onChange={set("location")} placeholder="e.g. Nairobi" /></FormField>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormField label="Role">
          <select value={form.role} onChange={set("role")}>
            {USER_ROLES.map(r => <option key={r} value={r}>{ROLE_META[r]?.label || r}</option>)}
          </select>
        </FormField>
        <FormField label="Password"><input type="password" value={form.password} onChange={set("password")} placeholder="Min 8 characters" /></FormField>
      </div>
      <div style={{ marginTop: 8, padding: "10px 14px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", fontSize: 12, color: "var(--color-text-secondary)" }}>
        <strong>Role permissions:</strong> Admin : full access , Officer : create/close MOBs , Accounts : view GRNs , Viewer : read-only
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={submit} disabled={busy}>{busy ? "Creating…" : "Create user"}</Btn>
      </div>
    </div>
  );
}

function EditRightsModal({ user, onClose, onUpdated, toast }) {
  const [form, setForm]     = useState({
    name: user.name || "",
    email: user.email || "",
    employee_id: user.employee_id || "",
    location: user.location || "",
  });
  const [role, setRole]     = useState(user.role || "officer");
  const [manual, setManual] = useState(!!user.can_manual_weight);
  const [active, setActive] = useState(!!user.is_active);
  const [busy, setBusy]     = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setBusy(true);
    try {
      // Consolidate updates. Falls back to specific methods if generic update is missing.
      if (usersApi.update) {
        await usersApi.update(user.id, { ...form, role, can_manual_weight: manual, is_active: active });
      } else {
        if (role !== user.role) await usersApi.updateRole(user.id, role);
        if (manual !== !!user.can_manual_weight) await usersApi.setManualWeight(user.id, manual);
        if (active !== !!user.is_active) await usersApi.toggle(user.id);
      }
      onUpdated({ ...user, ...form, role, can_manual_weight: manual, is_active: active });
      onClose();
      toast("User rights updated.", "success");
    } catch (e) { toast(e.message, "error"); }
    finally { setBusy(false); }
  };

  const meta = ROLE_META[role] || ROLE_META.viewer;
  const ROLE_CAPS = {
    admin:    ["Full dashboard access", "Manage users & permissions", "Create/close MOBs", "View & print all GRNs", "Send & resend GRN emails", "Delete MOBs"],
    officer:  ["Create & close MOBs",  "Add livestock to MOBs",       "View own GRNs", "Offline sync", "Manual weight (if granted)"],
    accounts: ["View all GRNs",        "Print GRN documents",        "View MOB list", "View supplier list"],
    viewer:   ["View dashboard overview","View MOB list (read-only)", "View livestock data"],
  };

  return (
    <div>
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px", background: "var(--color-background-secondary)",
        borderRadius: "var(--border-radius-md)", marginBottom: 16,
      }}>
        <Avatar name={form.name} role={role} size={40} />
        <div>
          <div style={{ fontWeight: 600 }}>{form.name || "Unnamed User"}</div>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{form.employee_id || "No ID"} · {form.email}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormField label="Full name"><input value={form.name} onChange={set("name")} /></FormField>
        <FormField label="Employee ID"><input value={form.employee_id} onChange={set("employee_id")} /></FormField>
        <FormField label="Email address"><input type="email" value={form.email} onChange={set("email")} /></FormField>
        <FormField label="Location"><input value={form.location} onChange={set("location")} /></FormField>
      </div>

      <FormField label="Access Role">
        <select value={role} onChange={e => setRole(e.target.value)}>
          {USER_ROLES.map(r => <option key={r} value={r}>{ROLE_META[r]?.label || r}</option>)}
        </select>
      </FormField>

      {/* Role capabilities preview */}
      <div style={{
        padding: "10px 14px", borderRadius: "var(--border-radius-md)",
        background: meta.bg, marginBottom: 14,
      }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: meta.color, marginBottom: 6 }}>
          {ROLE_META[role]?.label} capabilities:
        </div>
        {(ROLE_CAPS[role] || []).map(c => (
          <div key={c} style={{ fontSize: 12, color: meta.color, display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <Icon name="Check" size={12} /> {c}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {[
          { label: "Manual weight entry", desc: "Allow entering weights when scale unavailable. Entry reason required.", val: manual, set: setManual, disabled: role === "admin" },
          { label: "Account active",      desc: "Inactive users cannot sign in. Their token will be revoked.", val: active, set: setActive, disabled: user.role === "admin" },
        ].map(p => (
          <div key={p.label} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 0", borderBottom: "0.5px solid var(--color-border-tertiary)",
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{p.label}</div>
              <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>{p.desc}</div>
            </div>
            <Toggle on={p.val} onChange={p.set} disabled={p.disabled} />
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save changes"}</Btn>
      </div>
    </div>
  );
}

function UsersPage({ users, setUsers, toast, loading }) {
  const [showAdd, setShowAdd]         = useState(false);
  const [editUser, setEditUser]       = useState(null);
  const [resetUser, setResetUser]     = useState(null);
  const [busy, setBusy]               = useState({});
  const [newPw, setNewPw]             = useState("");
  const [search, setSearch]           = useState("");
  const [filterRole, setFilterRole]   = useState("all");

  const filtered = users.filter(u => {
    if (!u) return false;
    const searchLower = String(search || "").toLowerCase();
    const nameMatch = String(u.name || "").toLowerCase().includes(searchLower);
    const idMatch = String(u.employee_id || "").toLowerCase().includes(searchLower);
    const matchSearch = !search || nameMatch || idMatch;
    const matchRole   = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const handleDelete = async u => {
    if (!window.confirm(`Permanently delete ${u.name}? This cannot be undone.`)) return;
    setBusy(b => ({ ...b, [u.id]: true }));
    try {
      await usersApi.delete(u.id);
      setUsers(p => p.filter(x => x.id !== u.id));
      toast("User deleted.", "success");
    } catch (e) { toast(e.message, "error"); }
    finally { setBusy(b => ({ ...b, [u.id]: false })); }
  };

  const handleResetPw = async () => {
    if (!newPw || newPw.length < 8) return toast("Password must be at least 8 characters.", "error");
    setBusy(b => ({ ...b, [resetUser.id]: true }));
    try {
      await usersApi.resetPassword(resetUser.id, newPw);
      setResetUser(null); setNewPw("");
      toast("Password reset. User must log in again.", "success");
    } catch (e) { toast(e.message, "error"); }
    finally { setBusy(b => ({ ...b, [resetUser.id]: false })); }
  };

  const onlineCount  = users.filter(u => u.is_online).length;
  const activeCount  = users.filter(u => u.is_active).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={s.grid4}>
        <KPI label="Total users"      value={users.length}   icon="Users" theme="blue" />
        <KPI label="Active accounts"  value={activeCount}    icon="UserCheck" sub="Can sign in" theme="green" />
        <KPI label="Online now"       value={onlineCount}    icon="Wifi"   sub="Last 5 minutes" theme="amber" />
        <KPI label="Field Officers"   value={users.filter(u => u.role === "officer").length} icon="Contact" theme="purple" />
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Icon name="Search" size={14} color="var(--color-text-tertiary)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or employee ID…"
            style={{ paddingLeft: 34 }} />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ width: "auto", minWidth: 160 }}>
          <option value="all">All roles</option>
          {USER_ROLES.map(r => <option key={r} value={r}>{ROLE_META[r]?.label}</option>)}
        </select>
        <Btn variant="primary" icon="UserPlus" onClick={() => setShowAdd(true)}>Add user</Btn>
      </div>

      <div style={s.card}>
        <DataTable
          cols={["User", "Employee ID", "Role", "Status", "Manual weight", "Last Activity", "Actions"]}
          empty="No users match your search."
          rows={loading ? [...Array(6)].map((_, i) => (
            <tr key={`skel-${i}`}>
              <TD>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="skeleton-box" style={{ width: 32, height: 32, borderRadius: "50%" }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton-box" style={{ height: 12, width: "120px", marginBottom: 6 }} />
                    <div className="skeleton-box" style={{ height: 10, width: "160px" }} />
                  </div>
                </div>
              </TD>
              <TD><div className="skeleton-box" style={{ height: 12, width: "80px" }} /></TD>
              <TD><div className="skeleton-box" style={{ height: 20, width: "70px", borderRadius: 20 }} /></TD>
              <TD><div className="skeleton-box" style={{ height: 20, width: "60px", borderRadius: 20 }} /></TD>
              <TD center><div className="skeleton-box" style={{ height: 20, width: "60px", borderRadius: 20, margin: "0 auto" }} /></TD>
              <TD><div className="skeleton-box" style={{ height: 12, width: "100px" }} /></TD>
              <TD>
                <div style={{ display: "flex", gap: 5 }}>
                  <div className="skeleton-box" style={{ height: 28, width: "60px", borderRadius: 8 }} />
                  <div className="skeleton-box" style={{ height: 28, width: "60px", borderRadius: 8 }} />
                </div>
              </TD>
            </tr>
          )) : filtered.map((u, idx) => {
            if (!u) return null;
            const meta = ROLE_META[u.role] || ROLE_META.viewer;
            return (
              <tr key={u.id || idx} style={{ opacity: u.is_active ? 1 : 0.55 }}>
                <TD>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={u.name} role={u.role} size={32} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{u.email || ""}</div>
                    </div>
                  </div>
                </TD>
                <TD mono>{u.employee_id || "None"}</TD>
                <TD>
                  <span style={{
                    padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500,
                    background: meta.bg, color: meta.color,
                  }}>{meta.label}</span>
                </TD>
                <TD>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 9, color: u.is_online ? C.green : "var(--color-border-secondary)" }}>●</span>
                    <Chip text={u.is_active ? "Active" : "Inactive"} color={u.is_active ? "green" : "gray"} />
                  </div>
                </TD>
                <TD center>
                  {u.can_manual_weight
                    ? <Chip text="Granted" color="green" />
                    : <span style={{ color: "var(--color-text-tertiary)", fontSize: 12 }}>None</span>}
                </TD>
                <TD>{u.last_seen ? fmtTimestamp(u.last_seen) : <span style={{ color: "var(--color-text-tertiary)" }}>Never</span>}</TD>
                <TD>
                  <div style={{ display: "flex", gap: 5 }}>
                    <Btn small icon="Edit" onClick={() => setEditUser(u)}>Manage</Btn>
                    <Btn small icon="Key" onClick={() => { setResetUser(u); setNewPw(""); }}>Reset pw</Btn>
                    <Btn small icon="Trash2" variant="danger" onClick={() => handleDelete(u)} disabled={!!busy[u.id]}>Delete</Btn>
                  </div>
                </TD>
              </tr>
            );
          })}
        />
      </div>

      {showAdd && <Modal title="Add new user" onClose={() => setShowAdd(false)} wide>
        <AddUserModal onClose={() => setShowAdd(false)} onCreated={u => setUsers(p => [...p, u])} toast={toast} />
      </Modal>}

      {editUser && <Modal title={`Manage User — ${editUser.name}`} onClose={() => setEditUser(null)} wide>
        <EditRightsModal user={editUser} onClose={() => setEditUser(null)}
          onUpdated={u => { setUsers(p => p.map(x => x.id === u.id ? u : x)); setEditUser(null); }}
          toast={toast} />
      </Modal>}

      {resetUser && <Modal title={`Reset password — ${resetUser.name}`} onClose={() => setResetUser(null)}>
        <FormField label="New password" hint="Min 8 characters. User must log in again after reset.">
          <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="New password" />
        </FormField>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
          <Btn onClick={() => setResetUser(null)}>Cancel</Btn>
          <Btn variant="primary" onClick={handleResetPw} disabled={busy[resetUser.id]}>Reset password</Btn>
        </div>
      </Modal>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PERMISSIONS PAGE
// ─────────────────────────────────────────────────────────────────────────────

function PermissionsPage({ users, setUsers, toast }) {
  const officers = users.filter(u => u.role === "officer");
  const [busy, setBusy] = useState({});

  const toggleManual = async u => {
    const newVal = !u.can_manual_weight;
    setBusy(b => ({ ...b, [u.id]: true }));
    try {
      await usersApi.setManualWeight(u.id, newVal);
      setUsers(p => p.map(x => x.id === u.id ? { ...x, can_manual_weight: newVal } : x));
      toast(`Manual weight ${newVal ? "granted to" : "revoked from"} ${u.name}.`, "success");
    } catch (e) { toast(e.message, "error"); }
    finally { setBusy(b => ({ ...b, [u.id]: false })); }
  };

  const MATRIX = [
    { section: "General Access", action: "Sign in & view dashboard", admin: true, officer: true,  accounts: true,  viewer: true  },
    { section: "General Access", action: "View MOB / Supplier lists", admin: true, officer: true,  accounts: true,  viewer: true  },
    
    { section: "Field Operations", action: "Create new MOBs",          admin: true, officer: true,  accounts: false, viewer: false },
    { section: "Field Operations", action: "Add livestock data",       admin: true, officer: true,  accounts: false, viewer: false },
    { section: "Field Operations", action: "Manual weight entry",      admin: true, officer: "Grant", accounts: false, viewer: false },
    
    { section: "Processing", action: "Close MOB & Generate GRN", admin: true, officer: true,  accounts: false, viewer: false },
    { section: "Processing", action: "View & Download GRNs",     admin: true, officer: true,  accounts: true,  viewer: false },
    { section: "Processing", action: "Print GRN Documents",      admin: true, officer: true,  accounts: true,  viewer: false },
    { section: "Processing", action: "Resend GRN Emails",        admin: true, officer: false, accounts: true,  viewer: false },
    
    { section: "Administration", action: "Manage users & roles",     admin: true, officer: false, accounts: false, viewer: false },
    { section: "Administration", action: "Revoke/Delete records",    admin: true, officer: false, accounts: false, viewer: false },
  ];

  const cell = v => {
    const style = { display: 'inline-flex', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.02em' };
    if (v === true) return <span style={{ ...style, background: C.greenBg, color: C.greenDark }}>YES</span>;
    if (v === false) return <span style={{ ...style, background: 'var(--color-background-tertiary)', color: 'var(--color-text-tertiary)' }}>NO</span>;
    return <span style={{ ...style, background: C.amberBg, color: C.amberDark }}>{String(v).toUpperCase()}</span>;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={s.grid2}>
        <div style={s.card}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Role capability matrix (Field Officer)</div>
          <DataTable
            cols={["Action", "Admin", "Field Officer", "Accounts", "Viewer"]}
            rows={MATRIX.map((r, i) => (
              <Fragment key={i}>
                { (i === 0 || MATRIX[i-1].section !== r.section) && (
                  <tr style={{ background: 'var(--color-background-secondary)' }}>
                    <TD colSpan={5} style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-tertiary)', padding: '8px 16px' }}>
                      {r.section}
                    </TD>
                  </tr>
                )}
                <tr>
                  <TD style={{ fontSize: 12, fontWeight: 500 }}>{r.action}</TD>
                  <TD center>{cell(r.admin)}</TD>
                  <TD center>{cell(r.officer)}</TD>
                  <TD center>{cell(r.accounts)}</TD>
                  <TD center>{cell(r.viewer)}</TD>
                </tr>
              </Fragment>
            ))}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={s.card}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Manual weight ;per Field Officer</div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 12 }}>
              Field Officers with this permission can enter weights manually when the Bluetooth scale is unavailable.
            </div>
            {officers.length === 0
              ? <div style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>No Field Officers found.</div>
              : officers.map(u => (
                  <div key={u.id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 0", borderBottom: "0.5px solid var(--color-border-tertiary)",
                  }}>
                    <Avatar name={u.name} role={u.role} size={28} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{u.employee_id}</div>
                    </div>
                    <Toggle on={!!u.can_manual_weight} onChange={() => toggleManual(u)} disabled={!!busy[u.id]} />
                    {busy[u.id] && <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>Saving…</span>}
                  </div>
                ))
            }
          </div>

          <div style={s.card}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>User categories</div>
            {USER_ROLES.map(r => {
              const meta = ROLE_META[r];
              const count = users.filter(u => u.role === r).length;
              return (
                <div key={r} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 0", borderBottom: "0.5px solid var(--color-border-tertiary)",
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="User" size={15} color={meta.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{meta.label}</div>
                    <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{count} user{count !== 1 ? "s" : ""}</div>
                  </div>
                  <span style={{ padding: "3px 12px", borderRadius: 20, background: meta.bg, color: meta.color, fontSize: 12, fontWeight: 500 }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCATIONS PAGE
// ─────────────────────────────────────────────────────────────────────────────

function LocationsPage({ chartData }) {
  const { locationData = [] } = chartData;
  const totalLocations = locationData.length;
  const totalLivestock = locationData.reduce((sum, d) => sum + d.livestock, 0);
  const topLocation = locationData[0] || { name: "N/A", livestock: 0 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={s.grid3}>
        <KPI label="Total Locations" value={totalLocations} icon="MapPin" theme="purple" />
        <KPI label="Top Boma (Livestock)" value={topLocation.livestock.toLocaleString()} sub={topLocation.name} icon="TrendingUp" theme="green" />
        <KPI label="Total Livestock (All Bomas)" value={totalLivestock.toLocaleString()} icon="BarChart3" theme="blue" />
      </div>

      <div style={s.card}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Livestock per Location</div>
        <ResponsiveContainer width="50%" height={300}>
          <BarChart data={locationData} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }} />
            <YAxis tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }} />
            <Tooltip 
              contentStyle={{ 
                borderRadius: 8, background: "var(--color-background-primary)", 
                border: "0.5px solid var(--color-border-tertiary)", fontSize: 12,
                color: "var(--color-text-primary)" 
              }} itemStyle={{ color: "var(--color-text-primary)" }} />
            <Bar dataKey="livestock" fill={C.blue} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={s.card}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Boma Location Statistics</div>
        <DataTable
          cols={["Boma Location", "Total MOBs", "Total Livestock", "Total Weight (KG)", "% of Intake"]}
          empty="No location data available."
          rows={locationData.map(d => (
            <tr key={d.name}>
              <TD>{d.name}</TD>
              <TD>{d.mobs}</TD>
              <TD>{d.livestock.toLocaleString()}</TD>
              <TD>{d.weight.toFixed(2)}</TD>
              <TD>{totalLivestock ? ((d.livestock / totalLivestock) * 100).toFixed(1) : 0}%</TD>
            </tr>
          ))}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPPLIERS PAGE
// ─────────────────────────────────────────────────────────────────────────────

function SuppliersPage({ suppliers, loading }) {
  const [search, setSearch] = useState("");
  const filtered = suppliers.filter(s => {
    if (!s) return false;
    const searchLower = String(search || "").toLowerCase();
    const nameMatch = String(s.name || "").toLowerCase().includes(searchLower);
    const idMatch = String(s.farmer_no || "").toLowerCase().includes(searchLower);
    return !search || nameMatch || idMatch;
  });
  const withEmail = suppliers.filter(s => s.email).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={s.grid4}>
        <KPI label="Total suppliers" value={suppliers.length}   icon="Store" theme="blue" loading={loading} />
        <KPI label="With email"      value={withEmail}          icon="Mail"  sub="Can receive GRN" theme="green" loading={loading} />
        <KPI label="Without email"   value={suppliers.length - withEmail} icon="MailX" theme="amber" loading={loading} />
        <KPI label="Active"          value={suppliers.filter(s => s.is_active !== false).length} icon="Check" theme="purple" loading={loading} />
      </div>

      <div style={{ ...s.row, gap: 10 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Icon name="Search" size={14} color="var(--color-text-tertiary)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search suppliers…" style={{ paddingLeft: 34 }} />
        </div>
      </div>

      <div style={s.card}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Supplier directory : {filtered.length} records</div>
        <DataTable
          cols={["Farmer No.", "Name", "Phone", "Location", "Email", "Bank", "Status"]}
          empty="No suppliers found."
          rows={loading ? Array(8).fill(0).map((_, i) => (
            <tr key={`skel-sup-${i}`}>
              <TD><div className="skeleton-box" style={{ height: 12, width: "80px" }} /></TD>
              <TD><div className="skeleton-box" style={{ height: 12, width: "150px" }} /></TD>
              <TD><div className="skeleton-box" style={{ height: 12, width: "100px" }} /></TD>
              <TD><div className="skeleton-box" style={{ height: 12, width: "90px" }} /></TD>
              <TD><div className="skeleton-box" style={{ height: 12, width: "140px" }} /></TD>
              <TD><div className="skeleton-box" style={{ height: 12, width: "100px" }} /></TD>
              <TD><div className="skeleton-box" style={{ height: 20, width: "60px", borderRadius: 20 }} /></TD>
            </tr>
          )) : filtered.map((s, i) => (
            <tr key={s.id || i}>
              <TD mono>{s.farmer_no || "None"}</TD>
              <TD>{s.name}</TD>
              <TD>{s.phone || "None"}</TD>
              <TD>{s.location || "None"}</TD>
              <TD>{s.email || <span style={{ color: "var(--color-text-tertiary)", fontSize: 12 }}>No email</span>}</TD>
              <TD>{s.bank_name || <span style={{ color: "var(--color-text-tertiary)", fontSize: 12 }}>None</span>}</TD>
              <TD><Chip text={s.is_active !== false ? "Active" : "Inactive"} color={s.is_active !== false ? "green" : "gray"} /></TD>
            </tr>
          ))}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────────────────────

function Dashboard({ theme, setTheme }) {
  const { currentUser, logout } = useAuth();
  const [active,    setActive]    = useState("overview");
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem("sidebar_collapsed") === "true");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", isCollapsed);
  }, [isCollapsed]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsCollapsed(true);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [mobs,      setMobs]      = useState([]);
  const [users,     setUsers]     = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [livestock, setLivestock] = useState([]);
  const [chartData, setChartData] = useState({ intakeData: FALLBACK_INTAKE });
  const [loading,   setLoading]   = useState(true);
  const [toast,     setToastMsg]  = useState({ msg: "", type: "success" });

  const showToast = useCallback((msg, type = "success") => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg({ msg: "", type: "success" }), 4000);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [mr, ur, sr] = await Promise.allSettled([
      mobsApi.getAll({ per_page: 200 }),
      usersApi.getAll(),
      suppliersApi.getAll(),
    ]);

    if (mr.status === "fulfilled") {
      const mobList = extractArray(mr.value);
      setMobs(mobList);
      const livestockList = mobList.flatMap(m => m.livestock || []);
      setLivestock(livestockList);

      const speciesCounts = {};
      const genderCounts  = { Male: 0, Female: 0 };
      const weightBuckets = { "<100": 0, "100-200": 0, "200-300": 0, "300-400": 0, ">400": 0 };
      const locationCounts = {};
      const locationWeights = {};
      const locationLivestock = {};

      livestockList.forEach(a => {
        const sp = (a.species || "Unknown");
        const spCap = sp.charAt(0).toUpperCase() + sp.slice(1);
        speciesCounts[spCap] = (speciesCounts[spCap] || 0) + 1;
        if (a.gender === "male")   genderCounts.Male++;
        if (a.gender === "female") genderCounts.Female++;
        const w = parseFloat(a.weight || 0);
        if      (w < 100) weightBuckets["<100"]++;
        else if (w < 200) weightBuckets["100-200"]++;
        else if (w < 300) weightBuckets["200-300"]++;
        else if (w < 400) weightBuckets["300-400"]++;
        else              weightBuckets[">400"]++;
      });

      mobList.forEach(m => {
        const loc = getMobLocation(m) || "Unknown";
        locationCounts[loc] = (locationCounts[loc] || 0) + 1;
        locationWeights[loc] = (locationWeights[loc] || 0) + Number(m.total_weight || 0);
        locationLivestock[loc] = (locationLivestock[loc] || 0) + (getMobLivestockCount(m) || 0);
      });

      // Calculate actual monthly livestock intake from fetched MOB data
      const intakeMap = {};
      mobList.forEach(m => {
        const date = m.received_date || m.created_at;
        if (date) {
          const month = new Date(date).toLocaleString("en-US", { month: "short" });
          intakeMap[month] = (intakeMap[month] || 0) + (getMobLivestockCount(m) || 0);
        }
      });
      const actualIntakeData = FALLBACK_MONTHS.map(m => ({ month: m, livestock: intakeMap[m] || 0 }));

      // Daily Analytics Processing
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      
      const openedToday = mobList.filter(m => new Date(m.created_at).getTime() >= todayStart).length;
      const closedToday = mobList.filter(m => m.mob_status === "CLOSED" && new Date(m.updated_at || m.received_date).getTime() >= todayStart).length;
      const livestockToday = mobList
        .filter(m => new Date(m.created_at).getTime() >= todayStart)
        .reduce((s, m) => s + (getMobLivestockCount(m) || 0), 0);
      const activeStaff = new Set(mobList.filter(m => new Date(m.updated_at || m.created_at).getTime() >= todayStart).map(m => m.officer?.id)).size;

      const dailyTrendData = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        const dEnd = dStart + 86400000;
        
        const count = mobList.filter(m => {
          const mt = new Date(m.created_at).getTime();
          return mt >= dStart && mt < dEnd;
        }).length;
        dailyTrendData.push({ day: label, count });
      }

      const SCOLS = { Cattle: C.blue, Sheep: C.green, Goat: C.amber, Camel: C.purple };
      setChartData({
        intakeData: actualIntakeData,
        dailyStats: { openedToday, closedToday, livestockToday, activeStaff },
        dailyTrendData,
        mobStatusData: [
          { name: "Open",   value: mobList.filter(m => m.mob_status === "OPEN").length,   color: C.green },
          { name: "Closed", value: mobList.filter(m => m.mob_status === "CLOSED").length, color: C.blue  },
        ],
        emailStatusData: [
          { name: "Sent",    value: mobList.filter(m => m.email_status === "SENT").length,    color: C.green  },
          { name: "Failed",  value: mobList.filter(m => m.email_status === "FAILED").length,  color: C.red    },
          { name: "Pending", value: mobList.filter(m => m.email_status === "PENDING").length, color: C.amber  },
        ],
        speciesCountData: Object.entries(speciesCounts).map(([name, value]) => ({ name, value, color: SCOLS[name] || C.gray })),
        genderData: [
          { name: "Male",   value: genderCounts.Male,   color: C.blue },
          { name: "Female", value: genderCounts.Female, color: C.purple },
        ],
        weightData: Object.entries(weightBuckets).map(([band, count]) => ({ band, count })),
        locationData: Object.entries(locationCounts).map(([name, count]) => ({
          name,
          mobs: count,
          weight: locationWeights[name],
          livestock: locationLivestock[name]
        })).sort((a,b) => b.livestock - a.livestock),
        mobTrendData: FALLBACK_MONTHS.map(m => {
          const opened = mobList.filter(mob => {
            const d = new Date(mob.created_at || new Date());
            return d.toLocaleString("en-US", { month: "short" }) === m;
          }).length;
          const closed = mobList.filter(mob => {
            if (mob.mob_status !== "CLOSED") return false;
            const d = new Date(mob.received_date || mob.updated_at || mob.created_at || new Date());
            return d.toLocaleString("en-US", { month: "short" }) === m;
          }).length;
          return { month: m, opened, closed };
        }),
      });
    }

    if (ur.status === "fulfilled") setUsers(extractArray(ur.value));
    if (sr.status === "fulfilled") setSuppliers(extractArray(sr.value));
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onlineCount = users.filter(u => u.is_online).length;

  const page = () => {
    if (loading && !["users", "mobs", "suppliers"].includes(active)) return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          border: `3px solid ${C.blueBg}`, borderTopColor: C.blue,
          animation: "spin 0.8s linear infinite",
        }} />
        <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Loading KMC data…</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
    
    // Route Protection: Redirect non-admins away from administration pages
    if (["users", "permissions"].includes(active) && currentUser?.role !== "admin") {
      setActive("overview");
      return null;
    }

    const props = { mobs, users, setUsers, suppliers, livestock, chartData, toast: showToast, currentUser, loading };
    switch (active) {
      case "overview":    return <OverviewPage    {...props} />;
      case "mobs":        return <MobsPage        {...props} />;
      case "livestock":   return <LivestockPage   {...props} />;
      case "grn":         return <GrnPage         {...props} />;
      case "users":       return <UsersPage       {...props} />;
      case "permissions": return <PermissionsPage {...props} />;
      case "locations":   return <LocationsPage   {...props} />;
      case "suppliers":   return <SuppliersPage   {...props} />;
      default:            return <OverviewPage    {...props} />;
    }
  };

  return (
    <div style={{ 
      display: "grid", 
      gridTemplateColumns: isCollapsed ? (isMobile ? "64px 1fr" : "80px 1fr") : "260px 1fr", 
      minHeight: "100vh", 
      background: "var(--color-background-tertiary)",
      transition: "grid-template-columns 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
    }}>
      <Sidebar
        active={active} setActive={setActive}
        currentUser={currentUser}
        onLogout={logout} onRefresh={loadData}
        onlineCount={onlineCount} mobCount={mobs.length}
        isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed}
      />
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--color-background-tertiary)", overflow: "hidden" }}>
        <TopBar active={active} onRefresh={loadData} theme={theme} setTheme={setTheme} />
        <main style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column", gap: 0 }}>
          {page()}
        </main>
      </div>
      <Toast msg={toast.msg} type={toast.type} />
    </div>
  );
}

function AppInner() {
  const { isAuthenticated } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem("kmc_theme") || "light");

  useEffect(() => {
    localStorage.setItem("kmc_theme", theme);
  }, [theme]);

  const themeVars = theme === "light" ? `
    :root {
      --color-background-primary: #ffffff;
      --color-background-secondary: #f9fafb;
      --color-background-tertiary: #f1f5f9;
      --color-text-primary: #111827;
      --color-text-secondary: #4b5563;
      --color-text-tertiary: #9ca3af;
      --color-border-primary: #e5e7eb;
      --color-border-secondary: #d1d5db;
      --color-border-tertiary: #cbd5e1;
      --color-sidebar-bg: linear-gradient(180deg, ${C.blue} 0%, ${C.blueDark} 100%);
      --color-sidebar-blur: none;
    }
    input, select, textarea {
      background: var(--color-background-primary);
      color: var(--color-text-primary);
      border: 1px solid var(--color-border-secondary);
    }
  ` : `
    :root {
      --color-background-primary: #1e293b;
      --color-background-secondary: #334155;
      --color-background-tertiary: #0f172a;
      --color-text-primary: #f9fafb;
      --color-text-secondary: #94a3b8;
      --color-text-tertiary: #64748b;
      --color-border-primary: #64748b;
      --color-border-secondary: #334155;
      --color-border-tertiary: #1e293b;
      --color-sidebar-bg: linear-gradient(180deg, rgba(0, 56, 147, 0.9) 0%, rgba(1, 40, 89, 0.95) 100%);
      --color-sidebar-blur: blur(16px);
    }
    input, select, textarea {
      background: var(--color-background-secondary);
      color: var(--color-text-primary);
      border: 1px solid var(--color-border-primary);
    }
  `;

  return (
    <>
      <style>{themeVars}</style>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-btn-icon {
          animation: spin 1s linear infinite;
          display: inline-block;
        }
        @keyframes skeleton-pulse {
          0% { opacity: 0.6; }
          50% { opacity: 0.3; }
          100% { opacity: 0.6; }
        }
        .skeleton-box {
          animation: skeleton-pulse 1.5s infinite ease-in-out;
          background: var(--color-border-tertiary);
          border-radius: 4px;
        }
      `}</style>
      {isAuthenticated ? <Dashboard theme={theme} setTheme={setTheme} /> : <LoginPage theme={theme} setTheme={setTheme} />}
    </>
  );
}

export default function App() {
  return <AuthProvider><AppInner /></AuthProvider>;
}
