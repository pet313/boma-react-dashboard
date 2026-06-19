import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { Sidebar } from "../components/layout/Sidebar";
import { TopBar } from "../components/layout/TopBar";
import { Toast } from "../components/common/Toast";
import { OverviewPage } from "./OverviewPage";
import { MobsPage } from "./MobsPage";
import { LivestockPage } from "./LivestockPage";
import { GrnPage } from "./GrnPage";
import { UsersPage } from "./UsersPage";
import { PermissionsPage } from "./PermissionsPage";
import { LocationsPage } from "./LocationsPage";
import { SuppliersPage } from "./SuppliersPage";
import { mobsApi, usersApi, suppliersApi } from "../api";
import { C, FALLBACK_INTAKE, FALLBACK_MONTHS } from "../utils/constants";
import {
  extractArray, getMobLivestockCount, getMobLocation,
  buildMobStatusData, buildEmailStatusData, buildSpeciesData,
  buildGenderData, buildWeightData
} from "../utils/helpers";

export function Dashboard({ theme, setTheme }) {
  const { currentUser, logout } = useAuth();
  const [active,    setActive]    = useState("overview");
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem("sidebar_collapsed") === "true");
  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", isCollapsed);
  }, [isCollapsed]);
  const [mobs,      setMobs]      = useState([]);
  const [users,     setUsers]     = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [livestock, setLivestock] = useState([]);
  const [chartData, setChartData] = useState({ intakeData: FALLBACK_INTAKE });
  const [loading,   setLoading]   = useState(true);
  const [toast,     setToastMsg]  = useState({ msg: "", type: "success" });
  const isFetchingRef = useRef(false);

  const showToast = useCallback((msg, type = "success") => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg({ msg: "", type: "success" }), 4000);
  }, []);

  const loadData = useCallback(async (silent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (!silent) setLoading(true);
    try {
      const [mr, ur, sr] = await Promise.allSettled([
        mobsApi.getAll({ per_page: 200 }),
        usersApi.getAll(),
        suppliersApi.getAll(),
      ]);

      const mobList = mr.status === "fulfilled" ? extractArray(mr.value) : [];
      setMobs(mobList);

      if (mr.status === "fulfilled") {
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
          const month = new Date(date).toLocaleString("en-GB", { month: "short" });
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
        const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); // Start of day
        const dEnd = dStart + 86400000;

        const count = mobList.filter(m => {
          const mt = new Date(m.created_at).getTime();
          return mt >= dStart && mt < dEnd;
        }).length;
        dailyTrendData.push({ day: label, count });
      }

      setChartData({
        intakeData: actualIntakeData,
        dailyStats: { openedToday, closedToday, livestockToday, activeStaff },
        dailyTrendData,
        mobStatusData:   buildMobStatusData(mobList, C),
        emailStatusData: buildEmailStatusData(mobList, C),
        speciesCountData: buildSpeciesData(livestockList, C),
        genderData:      buildGenderData(livestockList, C),
        weightData:      buildWeightData(livestockList),
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
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadData();
    const pollInterval = setInterval(() => {
      loadData(true);
    }, 30000);
    return () => clearInterval(pollInterval);
  }, [loadData]);

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

    if (["users", "permissions"].includes(active) && currentUser?.role !== "admin") {
      setActive("overview");
      return null;
    }

    const props = { mobs, setMobs, users, setUsers, suppliers, livestock, chartData, toast: showToast, currentUser, loading };
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
    <div className="dashboard-layout" style={{
      display: "grid",
      gridTemplateColumns: isCollapsed ? "80px 1fr" : "260px 1fr",
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
        <TopBar active={active} onRefresh={loadData} theme={theme} setTheme={setTheme} setIsCollapsed={setIsCollapsed} isCollapsed={isCollapsed} />
        <main className="dashboard-main" style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column", gap: 0 }}>
          {page()}
        </main>
      </div>
      <Toast msg={toast.msg} type={toast.type} />
    </div>
  );
}
