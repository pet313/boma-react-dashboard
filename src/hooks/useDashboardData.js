import { useState, useCallback } from "react";
import { mobsApi, usersApi, suppliersApi } from "../api";
import { extractArray, buildMobStatusData, buildEmailStatusData,
         buildSpeciesData, buildGenderData, buildWeightData } from "../utils/helpers";
import { COLOURS, FALLBACK_INTAKE_DATA } from "../utils/constants";

/**
 * Orchestrates all dashboard data fetching.
 * Returns { mobs, users, suppliers, chartData, loading, error, refresh }
 */
export function useDashboardData() {
  const [mobs,      setMobs]      = useState([]);
  const [users,     setUsers]     = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [livestock, setLivestock] = useState([]);
  const [chartData, setChartData] = useState({ intakeData: FALLBACK_INTAKE_DATA });
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [mobsRes, usersRes, suppliersRes] = await Promise.allSettled([
      mobsApi.getAll({ per_page: 200 }),
      usersApi.getAll(),
      suppliersApi.getAll(),
    ]);

    // ── MOBs ─────────────────────────────────────────────────────────────────
    if (mobsRes.status === "fulfilled") {
      const mobList = extractArray(mobsRes.value);
      setMobs(mobList);

      // Flatten livestock from all mobs for species/gender/weight charts
      const allAnimals = mobList.flatMap(m => m.livestock || []);
      setLivestock(allAnimals);

      setChartData(prev => ({
        ...prev,
        mobStatusData:   buildMobStatusData(mobList, COLOURS),
        emailStatusData: buildEmailStatusData(mobList, COLOURS),
        speciesCountData: buildSpeciesData(allAnimals, COLOURS),
        genderData:      buildGenderData(allAnimals, COLOURS),
        weightData:      buildWeightData(allAnimals),
        // Aggregate Trend data from mobList
        mobTrendData: FALLBACK_INTAKE_DATA.map(m => {
          const stats = mobList.reduce((acc, mob) => {
            const openedDate = new Date(mob.created_at);
            if (openedDate.toLocaleString("en-US", { month: "short" }) === m.month) {
              acc.opened++;
            }
            if (mob.mob_status === "CLOSED") {
              const closedDate = new Date(mob.updated_at || mob.received_date || mob.created_at);
              if (closedDate.toLocaleString("en-US", { month: "short" }) === m.month) {
                acc.closed++;
              }
            }
            return acc;
          }, { opened: 0, closed: 0 });
          return { month: m.month, ...stats };
        }),
      }));
    } else {
      setError(mobsRes.reason?.message || "Failed to load MOBs");
    }

    // ── Users ─────────────────────────────────────────────────────────────────
    if (usersRes.status === "fulfilled") {
      setUsers(extractArray(usersRes.value));
    }

    // ── Suppliers ─────────────────────────────────────────────────────────────
    if (suppliersRes.status === "fulfilled") {
      const supList = extractArray(suppliersRes.value);
      setSuppliers(supList);
      setChartData(prev => ({
        ...prev,
        supplierData: [...supList]
          .sort((a, b) => (b.mobs_count || 0) - (a.mobs_count || 0))
          .slice(0, 10)
          .map(s => ({ name: s.name, animals: s.total_animals || s.mobs_count || 0 })),
      }));
    }

    setLoading(false);
  }, []);

  return { mobs, setMobs, users, setUsers, suppliers, livestock,
           chartData, loading, error, refresh };
}
