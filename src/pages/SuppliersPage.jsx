import { useState } from "react";
import { KPI } from "../components/common/KPI";
import { Icon } from "../components/common/Icon";
import { DataTable, TD } from "../components/common/DataTable";
import { Chip } from "../components/common/Chip";
import { s } from "../utils/constants";

export function SuppliersPage({ suppliers, loading }) {
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
      <div className="responsive-grid-4">
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

      <div className="card">
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
