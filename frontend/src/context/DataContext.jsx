import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { projectsAPI, bidsAPI, blockchainAPI, suppliersAPI, procurementAPI, dashboardAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [cache, setCache] = useState({ projects: [], bids: [], blockchainRecords: [], suppliers: [], procurementRequests: [], stats: null });
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) { setIsInitialLoading(false); return; }
    try {
      const role = user.role;
      const promises = [projectsAPI.getAll()];

      if (role === "supplier") {
        promises.push(bidsAPI.getAll(), blockchainAPI.getMyResults());
      } else if (role === "admin") {
        promises.push(bidsAPI.getAll(), blockchainAPI.getAll(), suppliersAPI.getAll(), dashboardAPI.getStats());
      } else if (role === "school_head") {
        promises.push(procurementAPI.getAll());
      }

      const results = await Promise.allSettled(promises);
      const get = (i) => results[i]?.status === "fulfilled" ? (results[i].value.data?.results || results[i].value.data?.data || results[i].value.data || []) : [];

      const projects = Array.isArray(get(0)) ? get(0) : [];

      if (role === "supplier") {
        setCache({ projects, bids: Array.isArray(get(1)) ? get(1) : [], blockchainRecords: Array.isArray(get(2)) ? get(2) : [], suppliers: [], procurementRequests: [], stats: null });
      } else if (role === "admin") {
        const stats = results[4]?.status === "fulfilled" ? results[4].value.data : null;
        setCache({ projects, bids: Array.isArray(get(1)) ? get(1) : [], blockchainRecords: Array.isArray(get(2)) ? get(2) : [], suppliers: Array.isArray(get(3)) ? get(3) : [], procurementRequests: [], stats });
      } else if (role === "school_head") {
        setCache({ projects, bids: [], blockchainRecords: [], suppliers: [], procurementRequests: Array.isArray(get(1)) ? get(1) : [], stats: null });
      }
    } catch (err) {
      console.error("DataContext fetch error:", err);
    } finally {
      setIsInitialLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const refresh = useCallback(() => fetchData(), [fetchData]);

  return (
    <DataContext.Provider value={{ cache, isInitialLoading, refresh }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}

export default DataProvider;
