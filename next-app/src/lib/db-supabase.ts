import { supabaseServer } from "./supabase-server";
import { dbDirect } from "./db-direct";
import { v4 as uuid } from "uuid";

const USERS_TABLE = "users";
const PROJECTS_TABLE = "projects_project";
const BIDS_TABLE = "bids_bid";
const NOTIFICATIONS_TABLE = "notifications";
const AUDIT_LOGS_TABLE = "audit_logs";
const DOCUMENT_UPLOADS_TABLE = "document_uploads";
const PROCUREMENTS_TABLE = "procurements";
const BUSINESS_TYPES_TABLE = "business_types";
const SUPPLIER_BUSINESS_TYPES_TABLE = "supplier_business_types";

type OrderBy = Record<string, "asc" | "desc"> | Array<Record<string, "asc" | "desc">>;

type Takeable = { take?: number; limit?: number };

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  return new Date(String(value));
}

function pick<T extends Record<string, any>>(value: T, keys?: Record<string, boolean>) {
  if (!keys) return value;
  const result: Record<string, any> = {};
  for (const [key, enabled] of Object.entries(keys)) {
    if (enabled && key in value) result[key] = value[key];
  }
  return result as T;
}

function hydrateUser(row: any) {
  if (!row) return row;
  return {
    ...row,
    verified_at: row.verified_at ? toDate(row.verified_at) : null,
    last_login: row.last_login ? toDate(row.last_login) : null,
    created_at: row.created_at ? toDate(row.created_at) : row.created_at,
    updated_at: row.updated_at ? toDate(row.updated_at) : row.updated_at,
  };
}

function hydrateProject(row: any) {
  if (!row) return row;
  return {
    ...row,
    deadline: row.deadline ? toDate(row.deadline) : row.deadline,
    procurement_schedule: row.procurement_schedule ? toDate(row.procurement_schedule) : row.procurement_schedule,
    public_result_expiry_date: row.public_result_expiry_date ? toDate(row.public_result_expiry_date) : row.public_result_expiry_date,
    archived_at: row.archived_at ? toDate(row.archived_at) : row.archived_at,
    published_at: row.published_at ? toDate(row.published_at) : row.published_at,
    awarded_at: row.awarded_at ? toDate(row.awarded_at) : row.awarded_at,
    created_at: row.created_at ? toDate(row.created_at) : row.created_at,
    updated_at: row.updated_at ? toDate(row.updated_at) : row.updated_at,
  };
}

function hydrateBid(row: any) {
  if (!row) return row;
  return {
    ...row,
    bid_amount: row.bid_amount != null ? Number(row.bid_amount) : row.bid_amount,
    submitted_at: row.submitted_at ? toDate(row.submitted_at) : row.submitted_at,
    updated_at: row.updated_at ? toDate(row.updated_at) : row.updated_at,
  };
}

function hydrateNotification(row: any) {
  if (!row) return row;
  return {
    ...row,
    created_at: row.created_at ? toDate(row.created_at) : row.created_at,
  };
}

function hydrateProcurement(row: any) {
  if (!row) return row;
  return {
    ...row,
    budget: row.budget != null ? Number(row.budget) : row.budget,
    deadline: row.deadline ? toDate(row.deadline) : row.deadline,
    public_result_expiry_date: row.public_result_expiry_date ? toDate(row.public_result_expiry_date) : row.public_result_expiry_date,
    reviewed_at: row.reviewed_at ? toDate(row.reviewed_at) : row.reviewed_at,
    created_at: row.created_at ? toDate(row.created_at) : row.created_at,
    updated_at: row.updated_at ? toDate(row.updated_at) : row.updated_at,
  };
}

function hydrateDocumentUpload(row: any) {
  if (!row) return row;
  return {
    ...row,
    created_at: row.created_at ? toDate(row.created_at) : row.created_at,
    updated_at: row.updated_at ? toDate(row.updated_at) : row.updated_at,
  };
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date);
}

function matchesValue(actual: unknown, expected: unknown) {
  if (isPlainObject(expected)) {
    const expectedRecord: any = expected;
    const actualDate = toDate(actual);
    if ("lt" in expectedRecord && (!actualDate || !(actualDate < toDate(expectedRecord.lt)!))) return false;
    if ("lte" in expectedRecord && (!actualDate || !(actualDate <= toDate(expectedRecord.lte)!))) return false;
    if ("gt" in expectedRecord && (!actualDate || !(actualDate > toDate(expectedRecord.gt)!))) return false;
    if ("gte" in expectedRecord && (!actualDate || !(actualDate >= toDate(expectedRecord.gte)!))) return false;
    if ("in" in expectedRecord && Array.isArray(expectedRecord.in) && !expectedRecord.in.includes(actual)) return false;
    if ("equals" in expectedRecord && actual !== expectedRecord.equals) return false;
    if ("not" in expectedRecord && actual === expectedRecord.not) return false;
    if (!("lt" in expectedRecord || "lte" in expectedRecord || "gt" in expectedRecord || "gte" in expectedRecord || "in" in expectedRecord || "equals" in expectedRecord || "not" in expectedRecord)) {
      return Object.entries(expectedRecord).every(([key, value]) => (actual as any)?.[key] === value);
    }
    return true;
  }

  if (actual instanceof Date || expected instanceof Date) {
    return new Date(String(actual)).getTime() === new Date(String(expected)).getTime();
  }

  return actual === expected;
}

function matchesWhere(row: any, where?: Record<string, any>): boolean {
  if (!where) return true;

  return Object.entries(where).every(([key, expected]) => {
    if (expected === undefined) return true;

    if (key === "NOT") {
      if (!isPlainObject(expected)) return true;
      return !matchesWhere(row, expected);
    }

    return matchesValue(row?.[key], expected);
  });
}

function matchesBusinessTypeWhere(row: any, where?: Record<string, any>): boolean {
  if (!where) return true;

  return Object.entries(where).every(([key, expected]) => {
    if (expected === undefined) return true;
    if (key === "name" && isPlainObject(expected)) {
      const equals = expected.equals;
      const mode = expected.mode;
      if (typeof equals === "string" && mode === "insensitive") {
        return String(row?.name || "").toLowerCase() === equals.toLowerCase();
      }
    }
    return matchesValue(row?.[key], expected);
  });
}

function normalizeUpdateArgs(whereOrParams: any, dataArg?: any) {
  if (dataArg !== undefined) {
    return { id: whereOrParams?.id, data: dataArg };
  }

  if (isPlainObject(whereOrParams) && "where" in whereOrParams && "data" in whereOrParams) {
    return { id: whereOrParams.where?.id, data: whereOrParams.data };
  }

  return { id: whereOrParams?.id, data: whereOrParams?.data };
}

function normalizeOrderBy(orderBy?: OrderBy) {
  if (!orderBy) return [] as Array<Record<string, "asc" | "desc">>;
  return Array.isArray(orderBy) ? orderBy : [orderBy];
}

function sortRows(rows: any[], orderBy?: OrderBy) {
  const criteria = normalizeOrderBy(orderBy);
  if (!criteria.length) return rows;

  return [...rows].sort((a, b) => {
    for (const clause of criteria) {
      const [key, direction] = Object.entries(clause)[0] || [];
      if (!key) continue;

      const left = a?.[key];
      const right = b?.[key];

      if (left == null && right == null) continue;
      if (left == null) return direction === "asc" ? 1 : -1;
      if (right == null) return direction === "asc" ? -1 : 1;

      const leftValue = left instanceof Date ? left.getTime() : Number.isNaN(Number(left)) ? String(left) : Number(left);
      const rightValue = right instanceof Date ? right.getTime() : Number.isNaN(Number(right)) ? String(right) : Number(right);

      if (leftValue < rightValue) return direction === "asc" ? -1 : 1;
      if (leftValue > rightValue) return direction === "asc" ? 1 : -1;
    }

    return 0;
  });
}

function applyTake(rows: any[], options?: Takeable) {
  const count = options?.take ?? options?.limit;
  if (!count) return rows;
  return rows.slice(0, count);
}

async function fetchRows(table: string) {
  const { data, error } = await supabaseServer.from(table).select("*");
  if (error) throw error;
  return data || [];
}

async function fetchRowById(table: string, id: string) {
  const { data, error } = await supabaseServer.from(table).select("*").eq("id", id).single();
  if (error) return null;
  return data;
}

async function fetchUserById(id: string) {
  return hydrateUser(await fetchRowById(USERS_TABLE, id));
}

async function fetchProjectById(id: string) {
  return hydrateProject(await fetchRowById(PROJECTS_TABLE, id));
}

async function fetchProcurementById(id: string) {
  return hydrateProcurement(await fetchRowById(PROCUREMENTS_TABLE, id));
}

async function fetchBusinessTypeById(id: string) {
  return fetchRowById(BUSINESS_TYPES_TABLE, id);
}

async function fetchBusinessTypesByWhere(where?: Record<string, any>) {
  const rows = await fetchRows(BUSINESS_TYPES_TABLE);
  return rows.filter((row: any) => matchesWhere(row, where));
}

async function fetchSupplierBusinessTypesByWhere(where?: Record<string, any>) {
  const rows = await fetchRows(SUPPLIER_BUSINESS_TYPES_TABLE);
  return rows.filter((row: any) => matchesWhere(row, where));
}

async function fetchBidById(id: string) {
  return hydrateBid(await fetchRowById(BIDS_TABLE, id));
}

async function fetchBlockchainRecordById(id: string) {
  const { data, error } = await supabaseServer.from("blockchain_blockchainrecord").select("*").eq("id", id).single();
  if (error) return null;
  return data;
}

async function fetchNotificationsByWhere(where?: Record<string, any>) {
  return dbDirect.notification.findMany({ where });
}

async function fetchBidsByWhere(where?: Record<string, any>) {
  const rows = await fetchRows(BIDS_TABLE);
  return rows.filter((row: any) => matchesWhere(row, where)).map(hydrateBid);
}

async function fetchBlockchainRecordsByWhere(where?: Record<string, any>) {
  const { data, error } = await supabaseServer.from("blockchain_blockchainrecord").select("*");
  if (error) throw error;
  return (data || []).filter((row: any) => matchesWhere(row, where));
}

async function loadProjectWithInclude(project: any, include?: any) {
  const hydrated = hydrateProject(project);
  if (!include) return hydrated;

  const result: any = { ...hydrated };
  if (include.created_by) {
    const createdBy = project.created_by_id ? await fetchUserById(project.created_by_id) : null;
    result.created_by = createdBy ? pick(createdBy, include.created_by?.select) : null;
  }
  if (include.procurement_request) {
    const procurement = project.procurement_request_id ? await fetchProcurementById(project.procurement_request_id) : null;
    result.procurement_request = procurement;
  }
  if (include.bids) {
    result.bids = await fetchBidsByWhere({ project_id: project.id });
  }
  return result;
}

async function loadBidWithInclude(bid: any, include?: any) {
  const hydrated = hydrateBid(bid);
  if (!include) return hydrated;

  const result: any = { ...hydrated };
  if (include.project) {
    const project = await fetchProjectById(bid.project_id);
    result.project = project ? pick(project, include.project?.select) : null;
  }
  if (include.supplier) {
    const supplier = await fetchUserById(bid.supplier_id);
    result.supplier = supplier ? pick(supplier, include.supplier?.select) : null;
  }
  return result;
}

async function loadBlockchainRecordWithInclude(record: any, include?: any) {
  const result: any = {
    ...record,
    bid_amount: record.bid_amount != null ? Number(record.bid_amount) : record.bid_amount,
    recorded_at: record.recorded_at ? toDate(record.recorded_at) : record.recorded_at,
  };

  if (!include) return result;

  if (include.project) {
    const project = await fetchProjectById(record.project_id);
    result.project = project ? pick(project, include.project?.select) : null;
  }
  if (include.bid) {
    const bid = await fetchBidById(record.bid_id);
    result.bid = bid ? pick(bid, include.bid?.select) : null;
  }
  if (include.winner) {
    const winner = await fetchUserById(record.winner_id);
    result.winner = winner ? pick(winner, include.winner?.select) : null;
  }

  return result;
}

async function loadProcurementWithInclude(procurement: any, include?: any) {
  const hydrated = hydrateProcurement(procurement);
  if (!include) return hydrated;

  const result: any = { ...hydrated };
  if (include.created_by) {
    const createdBy = procurement.created_by_id ? await fetchUserById(procurement.created_by_id) : null;
    result.created_by = createdBy ? pick(createdBy, include.created_by?.select) : null;
  }
  if (include.reviewed_by) {
    const reviewedBy = procurement.reviewed_by_id ? await fetchUserById(procurement.reviewed_by_id) : null;
    result.reviewed_by = reviewedBy ? pick(reviewedBy, include.reviewed_by?.select) : null;
  }
  if (include.project) {
    const { data: project, error } = await supabaseServer.from(PROJECTS_TABLE).select("*").eq("procurement_request_id", procurement.id).single();
    if (!error && project) result.project = hydrateProject(project);
  }
  return result;
}

async function applySimpleOperation(table: string, action: "update" | "delete", where?: Record<string, any>, data?: any) {
  const rows = await fetchRows(table);
  const matches = rows.filter((row: any) => matchesWhere(row, where));

  for (const row of matches) {
    if (action === "update") {
      const { error } = await supabaseServer.from(table).update(data).eq("id", row.id);
      if (error) throw error;
    } else {
      const { error } = await supabaseServer.from(table).delete().eq("id", row.id);
      if (error) throw error;
    }
  }

  return { count: matches.length };
}

async function upsertById(table: string, where: { id?: string }, createData: any, updateData: any) {
  if (!where.id) throw new Error("Upsert requires an id-based where clause.");
  const existing = await fetchRowById(table, where.id);
  if (existing) {
    const { data, error } = await supabaseServer.from(table).update(updateData).eq("id", where.id).select().single();
    if (error) throw error;
    return data;
  }

  const payload = { id: where.id, ...(createData?.data || createData) };
  const { data, error } = await supabaseServer.from(table).insert(payload).select().single();
  if (error) throw error;
  return data;
}

function applyGroupBy(rows: any[], by: string[], orderBy?: Record<string, "asc" | "desc">) {
  const groups = new Map<string, any>();

  for (const row of rows) {
    const key = JSON.stringify(by.map((field) => row?.[field] ?? null));
    if (!groups.has(key)) {
      const group: Record<string, any> = {};
      for (const field of by) group[field] = row?.[field] ?? null;
      group._count = { id: 0 };
      groups.set(key, group);
    }
    groups.get(key)._count.id += 1;
  }

  const grouped = Array.from(groups.values());
  if (orderBy) {
    const [key, direction] = Object.entries(orderBy)[0] || [];
    if (key) grouped.sort((a, b) => {
      const left = a?.[key];
      const right = b?.[key];
      if (left < right) return direction === "asc" ? -1 : 1;
      if (left > right) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  return grouped;
}

async function buildUserCount(userId: string, select?: Record<string, boolean>) {
  const count: Record<string, number> = {};

  if (!select) return count;

  if (select.bids) {
    const rows = await fetchRows(BIDS_TABLE);
    count.bids = rows.filter((row: any) => row.supplier_id === userId).length;
  }

  if (select.blockchain_records) {
    const rows = await fetchRows("blockchain_blockchainrecord");
    count.blockchain_records = rows.filter((row: any) => row.winner_id === userId).length;
  }

  if (select.document_uploads) {
    const rows = await fetchRows(DOCUMENT_UPLOADS_TABLE);
    count.document_uploads = rows.filter((row: any) => row.user_id === userId).length;
  }

  if (select.notifications) {
    count.notifications = await dbDirect.notification.count({ where: { recipient_id: userId } });
  }

  if (select.procurements) {
    const rows = await fetchRows(PROCUREMENTS_TABLE);
    count.procurements = rows.filter((row: any) => row.created_by_id === userId).length;
  }

  if (select.reviewed_procurements) {
    const rows = await fetchRows(PROCUREMENTS_TABLE);
    count.reviewed_procurements = rows.filter((row: any) => row.reviewed_by_id === userId).length;
  }

  if (select.projects) {
    const rows = await fetchRows(PROJECTS_TABLE);
    count.projects = rows.filter((row: any) => row.created_by_id === userId).length;
  }

  return count;
}

// Database utility using Supabase (replaces Prisma)
export const db = {
  user: {
    findUnique: async (params: { email?: string; id?: string; where?: { email?: string; id?: string } }) => {
      const filter = params.where ?? params;
      if (filter.email) {
        const { data, error } = await supabaseServer.from(USERS_TABLE).select('*').eq('email', filter.email).maybeSingle();
        if (error) throw error;
        return data;
      }
      if (filter.id) {
        const { data, error } = await supabaseServer.from(USERS_TABLE).select('*').eq('id', filter.id).maybeSingle();
        if (error) throw error;
        return data;
      }
      return null;
    },

    findFirst: async (params: any = {}) => {
      const { data, error } = await supabaseServer.from(USERS_TABLE).select('*');
      if (error) throw error;
      const rows = Array.isArray(data) ? data : [];
      const row = rows.find((item) => matchesWhere(item, params.where ?? params)) || null;
      if (!row) return null;
      return params.select ? pickUser(row, params.select) : row;
    },

    findMany: async (params: any = {}) => {
      const { data, error } = await supabaseServer.from(USERS_TABLE).select('*');
      if (error) throw error;
      const rows = Array.isArray(data) ? data : [];
      const filtered = rows.filter((item) => matchesWhere(item, params.where ?? params));
      const sorted = sortRows(filtered, params.orderBy);
      const limited = applyTake(sorted, params);
      if (!params.select) return limited;
      return limited.map((row) => pickUser(row, params.select));
    },

    create: async (params: any) => {
      const data = params.data || params;
      const { data: created, error } = await supabaseServer.from(USERS_TABLE).insert(data).select().maybeSingle();
      if (error) throw error;
      return created;
    },

    update: async (whereOrParams: any, dataArg?: any) => {
      const { id, data } = normalizeUpdateArgs(whereOrParams, dataArg);
      if (!id) throw new Error('Update requires an id-based where clause.');
      const updateData = isPlainObject(data) ? data : {};
      if (!Object.keys(updateData).length) {
        return await (supabaseServer.from(USERS_TABLE).select('*').eq('id', id).maybeSingle() as any);
      }
      const { data: updated, error } = await supabaseServer.from(USERS_TABLE).update(updateData).eq('id', id).select().maybeSingle();
      if (error) throw error;
      return updated;
    },

    delete: async (whereOrParams: { id?: string; where?: { id?: string } }) => {
      const id = whereOrParams.id ?? whereOrParams.where?.id;
      if (!id) throw new Error('Delete requires an id-based where clause.');
      const { data, error } = await supabaseServer.from(USERS_TABLE).delete().eq('id', id).select().maybeSingle();
      if (error) throw error;
      return data;
    },
    count: async (params: any = {}) => {
      const { data, error } = await supabaseServer.from(USERS_TABLE).select('*');
      if (error) throw error;
      const rows = Array.isArray(data) ? data : [];
      return rows.filter((item) => matchesWhere(item, params.where ?? params)).length;
    },
  },

  project: {
    findUnique: async (params: any) => {
      const rows = await fetchRows(PROJECTS_TABLE);
      const row = rows.find((item: any) => matchesWhere(item, params?.where));
      if (!row) return null;
      return loadProjectWithInclude(row, params?.include);
    },

    findFirst: async (params: any) => {
      const rows = await fetchRows(PROJECTS_TABLE);
      const row = rows.find((item: any) => matchesWhere(item, params?.where));
      if (!row) return null;
      return loadProjectWithInclude(row, params?.include);
    },

    findMany: async (params: any = {}) => {
      const rows = await fetchRows(PROJECTS_TABLE);
      const filtered = rows.filter((item: any) => matchesWhere(item, params.where));
      const sorted = sortRows(filtered, params.orderBy);
      const limited = applyTake(sorted, params);
      return Promise.all(limited.map((row: any) => loadProjectWithInclude(row, params.include)));
    },

    count: async (params: any = {}) => {
      const rows = await fetchRows(PROJECTS_TABLE);
      return rows.filter((item: any) => matchesWhere(item, params.where)).length;
    },

    create: async (params: any) => {
      const data = params.data || params;
      const payload = {
        id: data.id || uuid(),
        procurement_request_id: data.procurement_request_id ?? null,
        title: data.title,
        budget: data.budget,
        deadline: data.deadline,
        procurement_schedule: data.procurement_schedule ?? null,
        public_result_expiry_date: data.public_result_expiry_date ?? null,
        requirements: data.requirements ?? "",
        procurement_type: data.procurement_type ?? "Services",
        delivery_period: data.delivery_period ?? 0,
        technical_specifications: data.technical_specifications ?? "",
        status: data.status ?? "draft",
        is_archived: data.is_archived ?? false,
        archived_at: data.archived_at ?? null,
        archived_reason: data.archived_reason ?? null,
        published_at: data.published_at ?? null,
        awarded_at: data.awarded_at ?? null,
        created_by_id: data.created_by_id ?? null,
        updated_at: data.updated_at ?? new Date().toISOString(),
      };
      const { data: result, error } = await supabaseServer.from(PROJECTS_TABLE).insert(payload).select().single();
      if (error) throw error;
      return hydrateProject(result);
    },

    update: async (whereOrParams: any, dataArg?: any) => {
      const { id, data } = normalizeUpdateArgs(whereOrParams, dataArg);
      if (!id) throw new Error("Update requires an id-based where clause.");

      const updateData = isPlainObject(data) ? data : {};
      if (!Object.keys(updateData).length) {
        return fetchProjectById(id);
      }

      const { data: result, error } = await supabaseServer.from(PROJECTS_TABLE).update({ ...updateData, updated_at: new Date().toISOString() }).eq("id", id).select().single();
      if (error) throw error;
      return hydrateProject(result);
    },

    updateMany: async (params: any) => {
      const rows = await fetchRows(PROJECTS_TABLE);
      const matches = rows.filter((item: any) => matchesWhere(item, params.where));
      for (const row of matches) {
        const { error } = await supabaseServer.from(PROJECTS_TABLE).update(params.data).eq("id", row.id);
        if (error) throw error;
      }
      return { count: matches.length };
    },

    delete: async (whereOrParams: { id?: string; where?: { id?: string } }) => {
      const id = whereOrParams.id ?? whereOrParams.where?.id;
      if (!id) throw new Error("Delete requires an id-based where clause.");

      const { data, error } = await supabaseServer.from(PROJECTS_TABLE).delete().eq("id", id).select().single();
      if (error) throw error;
      return hydrateProject(data);
    },

    upsert: async (params: any) => {
      const where = params.where || {};
      const existing = where.id ? await fetchRowById(PROJECTS_TABLE, where.id) : null;
      if (existing) {
        const { data, error } = await supabaseServer.from(PROJECTS_TABLE).update({ ...(params.update || {}), updated_at: new Date().toISOString() }).eq("id", where.id).select().single();
        if (error) throw error;
        return hydrateProject(data);
      }
      const created = await db.project.create({ data: params.create || {} });
      return created;
    },

    groupBy: async (params: any) => {
      const rows = await fetchRows(PROJECTS_TABLE);
      const filtered = rows.filter((item: any) => matchesWhere(item, params.where));
      return applyGroupBy(filtered, params.by || [], params.orderBy);
    },
  },

  procurement: {
    findUnique: async (params: any) => {
      const rows = await fetchRows(PROCUREMENTS_TABLE);
      const row = rows.find((item: any) => matchesWhere(item, params?.where));
      return row ? loadProcurementWithInclude(row, params?.include) : null;
    },

    findFirst: async (params: any) => {
      const rows = await fetchRows(PROCUREMENTS_TABLE);
      const row = rows.find((item: any) => matchesWhere(item, params?.where));
      return row ? loadProcurementWithInclude(row, params?.include) : null;
    },

    findMany: async (params: any = {}) => {
      const rows = await fetchRows(PROCUREMENTS_TABLE);
      const filtered = rows.filter((item: any) => matchesWhere(item, params.where));
      const sorted = sortRows(filtered, params.orderBy);
      const limited = applyTake(sorted, params);
      return Promise.all(limited.map((row: any) => loadProcurementWithInclude(row, params.include)));
    },

    create: async (params: any) => {
      const data = params.data || params;
      const payload = {
        id: data.id || uuid(),
        title: data.project_title ?? data.title ?? "",
        description: data.technical_specifications ?? data.description ?? "",
        project_title: data.project_title,
        budget: data.budget,
        deadline: data.deadline ?? null,
        public_result_expiry_date: data.public_result_expiry_date ?? null,
        procurement_type: data.procurement_type,
        technical_specifications: data.technical_specifications ?? "",
        procurement_schedule: data.procurement_schedule ?? "",
        delivery_period: data.delivery_period ?? "",
        status: data.status ?? "Pending Review",
        rejection_reason: data.rejection_reason ?? "",
        revision_notes: data.revision_notes ?? "",
        review_remarks: data.review_remarks ?? null,
        created_by: data.created_by_id ?? data.created_by ?? null,
        reviewed_by_id: data.reviewed_by_id ?? null,
        reviewed_at: data.reviewed_at ?? null,
        created_by_id: data.created_by_id ?? null,
        updated_at: data.updated_at ?? new Date().toISOString(),
      };
      const { data: result, error } = await supabaseServer.from(PROCUREMENTS_TABLE).insert(payload).select().single();
      if (error) throw error;
      return hydrateProcurement(result);
    },

    update: async (whereOrParams: any, dataArg?: any) => {
      const { id, data } = normalizeUpdateArgs(whereOrParams, dataArg);
      if (!id) throw new Error("Update requires an id-based where clause.");

      const updateData = isPlainObject(data) ? data : {};
      if (!Object.keys(updateData).length) {
        return fetchProcurementById(id);
      }

      const { data: result, error } = await supabaseServer.from(PROCUREMENTS_TABLE).update({ ...updateData, updated_at: new Date().toISOString() }).eq("id", id).select().single();
      if (error) throw error;
      return hydrateProcurement(result);
    },

    delete: async (whereOrParams: { id?: string; where?: { id?: string } }) => {
      const id = whereOrParams.id ?? whereOrParams.where?.id;
      if (!id) throw new Error("Delete requires an id-based where clause.");

      const { data, error } = await supabaseServer.from(PROCUREMENTS_TABLE).delete().eq("id", id).select().single();
      if (error) throw error;
      return hydrateProcurement(data);
    },

    upsert: async (params: any) => {
      const where = params.where || {};
      if (!where.id) throw new Error("Upsert requires an id-based where clause.");
      const existing = await fetchRowById(PROCUREMENTS_TABLE, where.id);
      if (existing) {
        const { data, error } = await supabaseServer.from(PROCUREMENTS_TABLE).update({ ...(params.update || {}), updated_at: new Date().toISOString() }).eq("id", where.id).select().single();
        if (error) throw error;
        return hydrateProcurement(data);
      }
      return db.procurement.create({ data: { id: where.id, ...(params.create || {}) } });
    },
  },

  businessType: {
    findUnique: async (params: any) => {
      const where = params?.where || params;
      if (where?.id) return fetchBusinessTypeById(where.id);
      return null;
    },

    findFirst: async (params: any = {}) => {
      const rows = await fetchBusinessTypesByWhere(params.where);
      const row = rows.find((item: any) => matchesBusinessTypeWhere(item, params.where));
      return row || null;
    },

    findMany: async (params: any = {}) => {
      const rows = await fetchBusinessTypesByWhere(params.where).then((items) => items.filter((item: any) => matchesBusinessTypeWhere(item, params.where)));
      const sorted = sortRows(rows, params.orderBy);
      return applyTake(sorted, params);
    },

    create: async (params: any) => {
      const data = params.data || params;
      const payload = {
        id: data.id || uuid(),
        name: data.name,
        description: data.description ?? null,
        is_active: data.is_active ?? true,
        created_at: data.created_at ?? new Date().toISOString(),
        updated_at: data.updated_at ?? new Date().toISOString(),
      };
      const { data: result, error } = await supabaseServer.from(BUSINESS_TYPES_TABLE).insert(payload).select().single();
      if (error) throw error;
      return result;
    },
  },

  supplierBusinessType: {
    findMany: async (params: any = {}) => {
      const rows = await fetchSupplierBusinessTypesByWhere(params.where);
      const sorted = sortRows(rows, params.orderBy);
      const limited = applyTake(sorted, params);

      if (!params.include?.business_type) return limited;

      const selected = params.include.business_type.select;
      return Promise.all(limited.map(async (row: any) => {
        const businessType = row.business_type_id ? await fetchBusinessTypeById(row.business_type_id) : null;
        return {
          ...row,
          business_type: businessType && selected ? pick(businessType, selected) : businessType,
        };
      }));
    },

    createMany: async (params: any = {}) => {
      const data = params.data || [];
      let count = 0;
      for (const item of data) {
        const { error } = await supabaseServer.from(SUPPLIER_BUSINESS_TYPES_TABLE).insert({
          supplier_id: item.supplier_id,
          business_type_id: item.business_type_id,
          created_at: new Date().toISOString(),
        });
        if (error) {
          if (!params.skipDuplicates) throw error;
          continue;
        }
        count += 1;
      }
      return { count };
    },

    deleteMany: async (params: any = {}) => {
      const rows = await fetchSupplierBusinessTypesByWhere(params.where);
      for (const row of rows) {
        const { error } = await supabaseServer.from(SUPPLIER_BUSINESS_TYPES_TABLE).delete().eq("supplier_id", row.supplier_id).eq("business_type_id", row.business_type_id);
        if (error) throw error;
      }
      return { count: rows.length };
    },
  },

  blockchainRecord: {
    findUnique: async (params: any) => {
      const rows = await fetchBlockchainRecordsByWhere(params?.where);
      const row = rows[0] || null;
      return row ? loadBlockchainRecordWithInclude(row, params?.include) : null;
    },

    findFirst: async (params: any) => {
      const rows = await fetchBlockchainRecordsByWhere(params?.where);
      const row = rows[0] || null;
      return row ? loadBlockchainRecordWithInclude(row, params?.include) : null;
    },

    findMany: async (params: any = {}) => {
      const rows = await fetchBlockchainRecordsByWhere(params.where);
      const sorted = sortRows(rows, params.orderBy);
      const limited = applyTake(sorted, params);
      return Promise.all(limited.map((row: any) => loadBlockchainRecordWithInclude(row, params.include)));
    },

    aggregate: async (params: any = {}) => {
      const rows = await fetchBlockchainRecordsByWhere(params.where);
      const sumBidAmount = rows.reduce((sum: number, row: any) => sum + Number(row.bid_amount || 0), 0);
      return { _sum: { bid_amount: params._sum?.bid_amount ? sumBidAmount : null } };
    },

    create: async (params: any) => {
      const data = params.data || params;
      const payload = {
        id: data.id || uuid(),
        project_id: data.project_id,
        bid_id: data.bid_id,
        winner_id: data.winner_id,
        bid_amount: data.bid_amount,
        hash: data.hash,
        project_ref_id: data.project_ref_id ?? null,
        recorded_at: data.recorded_at ?? new Date(),
      };
      const { data: result, error } = await supabaseServer.from("blockchain_blockchainrecord").insert(payload).select().single();
      if (error) throw error;
      return loadBlockchainRecordWithInclude(result, params.include);
    },

    update: async (whereOrParams: any, dataArg?: any) => {
      const { id, data } = normalizeUpdateArgs(whereOrParams, dataArg);
      if (!id) throw new Error("Update requires an id-based where clause.");

      const updateData = isPlainObject(data) ? data : {};
      if (!Object.keys(updateData).length) {
        return fetchBlockchainRecordById(id);
      }

      const { data: result, error } = await supabaseServer.from("blockchain_blockchainrecord").update(updateData).eq("id", id).select().single();
      if (error) throw error;
      return loadBlockchainRecordWithInclude(result);
    },
  },

  bid: {
    findUnique: async (params: any) => {
      const rows = await fetchRows(BIDS_TABLE);
      const where = params?.where || {};
      const row = rows.find((item: any) => {
        if (where.id && item.id === where.id) return true;
        const compound = where.project_id_supplier_id;
        if (compound) {
          return item.project_id === compound.project_id && item.supplier_id === compound.supplier_id;
        }
        return matchesWhere(item, where);
      });
      if (!row) return null;
      return loadBidWithInclude(row, params?.include);
    },

    findFirst: async (params: any) => {
      const rows = await fetchRows(BIDS_TABLE);
      const filtered = rows.filter((item: any) => matchesWhere(item, params?.where));
      if (!filtered.length) return null;
      return loadBidWithInclude(filtered[0], params?.include);
    },

    findMany: async (params: any = {}) => {
      const rows = await fetchRows(BIDS_TABLE);
      const filtered = rows.filter((item: any) => matchesWhere(item, params.where));
      const sorted = sortRows(filtered, params.orderBy);
      const limited = applyTake(sorted, params);
      return Promise.all(limited.map((row: any) => loadBidWithInclude(row, params.include)));
    },

    count: async (params: any = {}) => {
      const rows = await fetchRows(BIDS_TABLE);
      return rows.filter((item: any) => matchesWhere(item, params.where)).length;
    },

    create: async (params: any) => {
      const data = params.data || params;
      const payload = {
        id: data.id || uuid(),
        project_id: data.project_id,
        supplier_id: data.supplier_id,
        company_name: data.company_name ?? "",
        bid_amount: data.bid_amount,
        proposal: data.proposal ?? "",
        quotation_file: data.quotation_file ?? null,
        quotation_document: data.quotation_document ?? data.quotation_file ?? null,
        technical_proposal: data.technical_proposal ?? null,
        supporting_documents: data.supporting_documents ?? null,
        technical_document: data.technical_document ?? null,
        no_conflict_of_interest: data.no_conflict_of_interest ?? false,
        conflict_of_interest_person: data.conflict_of_interest_person ?? null,
        no_past_scm_issues: data.no_past_scm_issues ?? false,
        status: data.status ?? "submitted",
        technical_compliance: data.technical_compliance ?? false,
        evaluation_remarks: data.evaluation_remarks ?? "",
        rank: data.rank ?? null,
        recorded: data.recorded ?? false,
        updated_at: data.updated_at ?? new Date().toISOString(),
      };
      const { data: result, error } = await supabaseServer.from(BIDS_TABLE).insert(payload).select().single();
      if (error) throw error;
      return hydrateBid(result);
    },

    update: async (whereOrParams: any, dataArg?: any) => {
      const { id, data } = normalizeUpdateArgs(whereOrParams, dataArg);
      if (!id) throw new Error("Update requires an id-based where clause.");

      const updateData = isPlainObject(data) ? data : {};
      if (!Object.keys(updateData).length) {
        return fetchBidById(id);
      }

      const { data: result, error } = await supabaseServer.from(BIDS_TABLE).update({ ...updateData, updated_at: new Date().toISOString() }).eq("id", id).select().single();
      if (error) throw error;
      return hydrateBid(result);
    },

    updateMany: async (params: any) => {
      const rows = await fetchRows(BIDS_TABLE);
      const matches = rows.filter((item: any) => matchesWhere(item, params.where));
      for (const row of matches) {
        const { error } = await supabaseServer.from(BIDS_TABLE).update({ ...(params.data || {}), updated_at: new Date().toISOString() }).eq("id", row.id);
        if (error) throw error;
      }
      return { count: matches.length };
    },

    delete: async (whereOrParams: { id?: string; where?: { id?: string } }) => {
      const id = whereOrParams.id ?? whereOrParams.where?.id;
      if (!id) throw new Error("Delete requires an id-based where clause.");

      const { data, error } = await supabaseServer.from(BIDS_TABLE).delete().eq("id", id).select().single();
      if (error) throw error;
      return hydrateBid(data);
    },
  },

  notification: {
    findUnique: async (params: any) => {
      const filter = params?.where ?? params;
      if (filter?.id) {
        const { data, error } = await supabaseServer.from(NOTIFICATIONS_TABLE).select("*").eq("id", filter.id).single();
        if (error) throw error;
        return hydrateNotification(data);
      }
      return dbDirect.notification.findUnique(params);
    },

    findFirst: async (params: any = {}) => {
      const filter = params.where ?? params;
      if (filter?.id || filter?.recipient_id || filter?.is_read !== undefined) {
        let query: any = supabaseServer.from(NOTIFICATIONS_TABLE).select("*");
        if (filter.id) query = query.eq("id", filter.id);
        if (filter.recipient_id) query = query.eq("recipient_id", filter.recipient_id);
        if (filter.is_read !== undefined) query = query.eq("is_read", filter.is_read);
        if (params.orderBy?.created_at) query = query.order("created_at", { ascending: params.orderBy.created_at === "asc" });
        if (params.take ?? params.limit) query = query.limit(params.take ?? params.limit);
        const { data, error } = await query.maybeSingle();
        if (error) throw error;
        return hydrateNotification(data);
      }
      return dbDirect.notification.findFirst(params);
    },

    findMany: async (params: any = {}) => {
      const filter = params.where ?? params;
      if (filter?.id || filter?.recipient_id || filter?.is_read !== undefined) {
        let query: any = supabaseServer.from(NOTIFICATIONS_TABLE).select("*");
        if (filter.id) query = query.eq("id", filter.id);
        if (filter.recipient_id) query = query.eq("recipient_id", filter.recipient_id);
        if (filter.is_read !== undefined) query = query.eq("is_read", filter.is_read);
        if (params.orderBy?.created_at) query = query.order("created_at", { ascending: params.orderBy.created_at === "asc" });
        if (params.take ?? params.limit) query = query.limit(params.take ?? params.limit);
        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map(hydrateNotification);
      }
      return dbDirect.notification.findMany(params);
    },

    count: async (params: any = {}) => {
      const filter = params.where ?? params;
      if (filter?.id || filter?.recipient_id || filter?.is_read !== undefined) {
        let query: any = supabaseServer.from(NOTIFICATIONS_TABLE).select("id", { count: "exact", head: false });
        if (filter.id) query = query.eq("id", filter.id);
        if (filter.recipient_id) query = query.eq("recipient_id", filter.recipient_id);
        if (filter.is_read !== undefined) query = query.eq("is_read", filter.is_read);
        const { count, error } = await query;
        if (error) throw error;
        return count ?? 0;
      }
      return dbDirect.notification.count(params);
    },

    create: async (params: any) => {
      const data = params.data || params;
      const payload = {
        id: data.id || uuid(),
        recipient_id: data.recipient_id,
        type: data.type,
        title: data.title,
        message: data.message,
        is_read: data.is_read ?? false,
        link: data.link ?? null,
        related_id: data.related_id ?? null,
        resource_type: data.resource_type ?? null,
        resource_id: data.resource_id ?? null,
        created_at: new Date().toISOString(),
      };
      const { data: result, error } = await supabaseServer.from(NOTIFICATIONS_TABLE).insert(payload).select().single();
      if (error) throw error;
      return hydrateNotification(result);
    },

    update: async (whereOrParams: any, dataArg?: any) => {
      const { id, data } = normalizeUpdateArgs(whereOrParams, dataArg);
      if (!id) throw new Error("Update requires an id-based where clause.");
      const updateData = isPlainObject(data) ? data : {};
      if (!Object.keys(updateData).length) {
        return dbDirect.notification.findUnique({ where: { id } });
      }
      const { data: result, error } = await supabaseServer.from(NOTIFICATIONS_TABLE).update({ ...updateData, updated_at: new Date().toISOString() }).eq("id", id).select().single();
      if (error) throw error;
      return hydrateNotification(result);
    },

    updateMany: async (params: any) => {
      const filter = params.where ?? params;
      const updateData = isPlainObject(params.data) ? params.data : {};
      if (!Object.keys(updateData).length) return { count: 0 };
      if (filter?.recipient_id || filter?.is_read !== undefined || filter?.id) {
        let query: any = supabaseServer.from(NOTIFICATIONS_TABLE).update({ ...updateData, updated_at: new Date().toISOString() });
        if (filter.id) query = query.eq("id", filter.id);
        if (filter.recipient_id) query = query.eq("recipient_id", filter.recipient_id);
        if (filter.is_read !== undefined) query = query.eq("is_read", filter.is_read);
        const { data, error } = await query.select("id");
        if (error) throw error;
        return { count: Array.isArray(data) ? data.length : 0 };
      }
      return dbDirect.notification.updateMany(params);
    },
  },

  auditLog: {
    create: async (params: any) => {
      const data = params.data || params;
      const { data: result, error } = await supabaseServer.from(AUDIT_LOGS_TABLE).insert({
        id: data.id,
        action: data.action,
        user_id: data.user_id,
        description: data.description,
        resource_type: data.resource_type,
        resource_id: data.resource_id,
      }).select().single();

      if (error) throw error;
      return result;
    },

    findMany: async (params: any = {}) => {
      const rows = await fetchRows(AUDIT_LOGS_TABLE);
      const filtered = rows.filter((row: any) => matchesWhere(row, params.where));
      const sorted = sortRows(filtered, params.orderBy);
      const limited = applyTake(sorted, params);

      const mapped = [] as any[];
      for (const row of limited) {
        const hydrated = {
          ...row,
          created_at: row.created_at ? toDate(row.created_at) : row.created_at,
        };

        if (params.include?.user) {
          const user = row.user_id ? await fetchUserById(row.user_id) : null;
          hydrated.user = user ? pick(user, params.include.user.select) : null;
        }

        mapped.push(hydrated);
      }

      return mapped;
    },
  },

  documentUpload: {
    findFirst: async (params: any = {}) => {
      const rows = await db.documentUpload.findMany(params);
      return rows[0] || null;
    },

    findMany: async (params: any = {}) => {
      const { data, error } = await supabaseServer.from(DOCUMENT_UPLOADS_TABLE).select("*");
      if (error) throw error;
      const filtered = (data || []).filter((row: any) => matchesWhere(row, params.where));
      const sorted = sortRows(filtered, params.orderBy);
      const limited = applyTake(sorted, params);
      return limited.map(hydrateDocumentUpload);
    },

    update: async (whereOrParams: any, dataArg?: any) => {
      const { id, data } = normalizeUpdateArgs(whereOrParams, dataArg);
      if (!id) throw new Error("Update requires an id-based where clause.");

      const updateData = isPlainObject(data) ? data : {};
      if (!Object.keys(updateData).length) {
        return db.documentUpload.findFirst({ where: { id } });
      }

      const { data: result, error } = await supabaseServer
        .from(DOCUMENT_UPLOADS_TABLE)
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return hydrateDocumentUpload(result);
    },

    create: async (params: {
      id?: string;
      user_id?: string;
      document_type?: string;
      file_name?: string;
      file?: string | null;
      file_size?: number;
      data?: {
        id?: string;
        user_id: string;
        document_type: string;
        file_name: string;
        file?: string | null;
        file_size?: number;
      };
    }) => {
      const data = params.data || params;
      const { data: result, error } = await supabaseServer.from(DOCUMENT_UPLOADS_TABLE).insert({
        id: data.id || uuid(),
        user_id: data.user_id,
        document_type: data.document_type,
        file_name: data.file_name,
        file: data.file,
        file_size: data.file_size ?? 0,
        verification_status: "Pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).select().single();

      if (error) throw error;
      return hydrateDocumentUpload(result);
    },
  },

  query: async (table: string, options: {
    select?: string;
    where?: Record<string, any>;
    orderBy?: { [key: string]: 'asc' | 'desc' };
    limit?: number;
  } = {}) => {
    let rows = await fetchRows(table);
    rows = rows.filter((row: any) => matchesWhere(row, options.where));
    rows = sortRows(rows, options.orderBy);
    if (options.limit) rows = rows.slice(0, options.limit);
    return rows;
  },
};