import { BarChart, Bar, PieChart, Pie, Cell, Tooltip, ResponsiveContainer, CartesianGrid, XAxis, YAxis } from "recharts";
import { KPI } from "../components/common/KPI";
import { Icon } from "../components/common/Icon";
import { C } from "../utils/constants";
import { getMobLivestockCount } from "../utils/helpers";

export function OverviewPage({ mobs, chartData, loading }) {
  const { intakeData = [], mobStatusData = [], emailStatusData = [], speciesCountData = [], weightData = [] } = chartData;
  const total = mobs.length;
  const open  = mobs.filter(m => m.mob_status === "OPEN").length;
  const livestockCount = mobs.reduce((s, m) => s + (getMobLivestockCount(m) || 0), 0);
  const totalWeight = mobs.reduce((s, m) => s + Number(m.total_weight || 0), 0);
  const avgWeight = livestockCount > 0 ? (totalWeight / livestockCount) : 0;
  const failed  = mobs.filter(m => m.email_status === "FAILED").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="responsive-grid-4">
        <KPI label="Total MOBs"       value={total}   icon="ListTodo" sub="Live from backend" theme="blue" loading={loading} />
        <KPI label="Total Livestock"    value={livestockCount.toLocaleString()} icon="BarChart3" theme="amber" loading={loading} />
        <KPI label="Avg Animal Weight" value={`${avgWeight.toFixed(1)} KG`} icon="Weight" sub="Global average" theme="purple" loading={loading} />
        <KPI label="Open MOBs"        value={open}    icon="LockOpen" sub="Accepting livestock" theme="green" loading={loading} />
      </div>

      <div className="responsive-grid-2">
        <div className="card">
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
          <div className="card" style={{ flex: 1 }}>
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

          <div className="card" style={{ flex: 1 }}>
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

      <div className="responsive-grid-2">
        <div className="card">
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

        <div className="card">
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
