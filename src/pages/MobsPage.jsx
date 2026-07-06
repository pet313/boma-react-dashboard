import { useState, useMemo } from "react";
import { BarChart, Bar, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { KPI } from "../components/common/KPI";
import { Icon } from "../components/common/Icon";
import { DataTable, TD } from "../components/common/DataTable";
import { Chip } from "../components/common/Chip";
import { C, s } from "../utils/constants";
import { getMobLivestockCount, getMobLocation } from "../utils/helpers";
import { ExportButton } from "../components/common/ExportButton";

export function MobsPage({ mobs, chartData, loading }) {
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

  const exportData = useMemo(() => {
    return filtered.map(m => ({
      "MOB Number": m.mob_number || m.id,
      "Supplier": m.supplier?.name || "N/A",
      "Location": getMobLocation(m) || "N/A",
      "Livestock Headcount": getMobLivestockCount(m) ?? 0,
      "Total Weight (KG)": Number(m.total_weight || 0).toFixed(2),
      "Status": m.mob_status,
      "Email Delivery": m.email_status || "N/A",
      "Date": m.created_at ? new Date(m.created_at).toLocaleDateString('en-GB') : "N/A"
    }));
  }, [filtered]);

  const exportOptions = useMemo(() => ({
    title: "KMC MOB Operations & Intake Analytics",
    sheetName: "MOB Activity",
    summaryData: {
      "Report Period": `${startDate || 'Start'} to ${endDate || 'Present'}`,
      "Total MOBs in Period": filtered.length,
      "Currently Open": open.length,
      "Total Closed": closed.length,
      "Livestock Received": livestockCount
    }
  }), [filtered, open, closed, livestockCount, startDate, endDate]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ ...s.row, justifyContent: "space-between", flexWrap: "wrap" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="Calendar" color={C.blue} size={18} />
          Today's Pulse
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
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
          <ExportButton
            data={exportData}
            fileName="KMC_MOB_Analytics"
            options={exportOptions}
            label="Export Analytics"
          />
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
      <div className="responsive-grid-4">
        <KPI label="Open MOBs"    value={open.length}   icon="LockOpen"    sub="Accepting livestock" theme="green" loading={loading} />
        <KPI label="Closed MOBs"  value={closed.length} icon="Lock"         sub="GRN generated" theme="blue" loading={loading} />
        <KPI label="Total Livestock" value={livestockCount.toLocaleString()} icon="BarChart3" theme="amber" loading={loading} />
      </div>

      <div className="responsive-grid-2">
        <div className="card">
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

        <div className="card">
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

        <div className="card">
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

      <div className="card">
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
