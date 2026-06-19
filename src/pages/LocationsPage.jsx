import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { KPI } from "../components/common/KPI";
import { DataTable, TD } from "../components/common/DataTable";
import { C } from "../utils/constants";

export function LocationsPage({ chartData }) {
  const { locationData = [] } = chartData;
  const totalLocations = locationData.length;
  const totalLivestock = locationData.reduce((sum, d) => sum + d.livestock, 0);
  const topLocation = locationData[0] || { name: "N/A", livestock: 0 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="responsive-grid-3">
        <KPI label="Total Locations" value={totalLocations} icon="MapPin" theme="purple" />
        <KPI label="Top Boma (Livestock)" value={topLocation.livestock.toLocaleString()} sub={topLocation.name} icon="TrendingUp" theme="green" />
        <KPI label="Total Livestock (All Bomas)" value={totalLivestock.toLocaleString()} icon="BarChart3" theme="blue" />
      </div>

      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Livestock per Location</div>
        <ResponsiveContainer width="100%" height={300}>
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

      <div className="card">
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
