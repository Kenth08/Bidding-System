import { useContext } from "react";
import ProcurementProvider, { ProcurementContext } from "../lib/ProcurementContext";

export function DataProvider({ children }) {
  return <ProcurementProvider>{children}</ProcurementProvider>;
}

export function useData() {
  const ctx = useContext(ProcurementContext) || {};

  const cache = {
    procurementRequests: ctx.requests || [],
    projects: ctx.projects || [],
    suppliers: ctx.suppliers || [],
    bids: ctx.bids || [],
  };

  async function refreshProcurement() {
    // compatibility shim: return current requests (no network layer here)
    return Promise.resolve(ctx.requests || []);
  }

  function updateItem(resource, id, payload) {
    // compatibility shim used by some pages: (resource === 'procurement')
    if (!resource) return null;
    const key = resource.toString().toLowerCase();
    if (key.includes("procurement") || key.includes("request")) {
      return ctx.updateRequest ? ctx.updateRequest(id, payload) : null;
    }
    if (key.includes("project")) {
      return ctx.updateProject ? ctx.updateProject(id, payload) : null;
    }
    if (key.includes("supplier")) {
      // attempt to update supplier via register/update API
      return ctx.updateSupplierStatus ? ctx.updateSupplierStatus(id, payload.status, payload.admin) : null;
    }
    return null;
  }

  return {
    cache,
    isInitialLoading: false,
    refreshProcurement,
    updateItem,
    // expose raw context for advanced use
    _internal: ctx,
    ...ctx,
  };
}

export default DataProvider;
