import { PieChart, Pie, Cell } from "recharts";
import { KPI } from "../components/common/KPI";
import { s } from "../utils/constants";
import { ExportButton } from "../components/common/ExportButton";
import { useMemo } from "react";

export function LivestockPage({ livestock, chartData }) {
  const { speciesCountData = [], genderData = [] } = chartData;
  const total  = livestock.length;
  const manual = livestock.filter(a => a.manual_entry).length;
  const avgW   = total ? (livestock.reduce((s, a) => s + Number(a.weight || 0), 0) / total) : 0;

  const exportData = useMemo(() => {
    return livestock.map(a => ({
      "Tag/Number": a.livestock_number || a.id,
      "Species": a.species || "N/A",
      "Gender": a.gender || "N/A",
      "Weight (KG)": Number(a.weight || 0).toFixed(2),
      "Entry Method": a.manual_entry ? "Manual" : "Scale",
      "Boma": a.location || "N/A",
      "Date": a.created_at ? new Date(a.created_at).toLocaleDateString('en-GB') : "N/A"
    }));
  }, [livestock]);

  const exportOptions = useMemo(() => ({
    title: "KMC Livestock Inventory Report",
    sheetName: "Livestock Registry",
    summaryData: {
      "Total Headcount": total,
      "Scale Weighed": total - manual,
      "Manual Entries": manual,
      "Average Weight (KG)": avgW.toFixed(2),
      "Audit Date": new Date().toLocaleDateString('en-GB')
    },
    analysisSheets: [
      {
        title: "Gender Distribution Analysis",
        sheetName: "Gender Breakdown",
        data: genderData.map(d => ({
          "Gender": d.name,
          "Count": d.value,
          "Percentage": total ? `${Math.round(d.value / total * 100)}%` : "0%"
        })),
        headers: ["Gender", "Count", "Percentage"]
      }
    ]
  }), [total, manual, avgW, genderData]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-secondary)" }}>
          Livestock Inventory Details
        </div>
        <ExportButton
          data={exportData}
          fileName="KMC_Livestock_Inventory"
          options={exportOptions}
          label="Export Inventory Report"
        />
      </div>

      <div className="responsive-grid-4">

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

        <div className="card">
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
