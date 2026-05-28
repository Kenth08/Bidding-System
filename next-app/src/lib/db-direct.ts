import { Pool } from 'pg';
import { v4 as uuid } from 'uuid';

// Direct PostgreSQL connection (bypass Supabase API issues)
const databaseUrl = process.env.DATABASE_URL || '';
const useSsl = /supabase|aws|cloud/i.test(databaseUrl) && !/localhost|127\.0\.0\.1|\[::1\]/i.test(databaseUrl);

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined
});

const USERS_TABLE = 'public.users';

type UserQueryParams = {
  where?: Record<string, any>;
  orderBy?: Record<string, "asc" | "desc"> | Array<Record<string, "asc" | "desc">>;
  take?: number;
  limit?: number;
  select?: Record<string, any>;
};

function sortRows(rows: any[], orderBy?: UserQueryParams["orderBy"]) {
  const criteria = Array.isArray(orderBy) ? orderBy : orderBy ? [orderBy] : [];
  if (!criteria.length) return rows;

  return [...rows].sort((left, right) => {
    for (const clause of criteria) {
      const [key, direction] = Object.entries(clause)[0] || [];
      if (!key) continue;

      const leftValue = left?.[key];
      const rightValue = right?.[key];

      if (leftValue == null && rightValue == null) continue;
      if (leftValue == null) return direction === "asc" ? 1 : -1;
      if (rightValue == null) return direction === "asc" ? -1 : 1;

      const normalizedLeft = leftValue instanceof Date ? leftValue.getTime() : leftValue;
      const normalizedRight = rightValue instanceof Date ? rightValue.getTime() : rightValue;

      if (normalizedLeft < normalizedRight) return direction === "asc" ? -1 : 1;
      if (normalizedLeft > normalizedRight) return direction === "asc" ? 1 : -1;
    }

    return 0;
  });
}

function applyTake(rows: any[], params?: UserQueryParams) {
  const count = params?.take ?? params?.limit;
  if (!count) return rows;
  return rows.slice(0, count);
}

function hydrateNotification(row: any) {
  if (!row) return row;
  return {
    ...row,
    created_at: row.created_at ? new Date(String(row.created_at)) : row.created_at,
  };
}

function hydrateDocumentUpload(row: any) {
  if (!row) return row;
  return {
    ...row,
    created_at: row.created_at ? new Date(String(row.created_at)) : row.created_at,
    updated_at: row.updated_at ? new Date(String(row.updated_at)) : row.updated_at,
    verified_at: row.verified_at ? new Date(String(row.verified_at)) : row.verified_at,
  };
}

function matchesWhere(row: any, where?: Record<string, any>) {
  if (!where) return true;
  return Object.entries(where).every(([key, expected]) => {
    if (expected === undefined) return true;
    return row?.[key] === expected;
  });
}

function matchesBusinessTypeWhere(row: any, where?: Record<string, any>) {
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
    return row?.[key] === expected;
  });
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);
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

function pickUser(row: any, select?: Record<string, any>) {
  if (!select) return row;
  const result: Record<string, any> = {};

  for (const [key, enabled] of Object.entries(select)) {
    if (!enabled || key === "_count") continue;
    if (key in row) result[key] = row[key];
  }

  return result;
}

async function buildUserCount(client: any, userId: string, select?: Record<string, any>) {
  const count: Record<string, number> = {};
  if (!select) return count;

  if (select.bids) {
    const bids = await client.query('SELECT COUNT(*)::int AS count FROM bids_bid WHERE supplier_id = $1', [userId]);
    count.bids = bids.rows[0]?.count ?? 0;
  }

  if (select.blockchain_records) {
    const records = await client.query('SELECT COUNT(*)::int AS count FROM blockchain_blockchainrecord WHERE winner_id = $1', [userId]);
    count.blockchain_records = records.rows[0]?.count ?? 0;
  }

  if (select.document_uploads) {
    const uploads = await client.query('SELECT COUNT(*)::int AS count FROM document_uploads WHERE user_id = $1', [userId]);
    count.document_uploads = uploads.rows[0]?.count ?? 0;
  }

  if (select.notifications) {
    const notifications = await client.query('SELECT COUNT(*)::int AS count FROM notifications WHERE recipient_id = $1', [userId]);
    count.notifications = notifications.rows[0]?.count ?? 0;
  }

  if (select.procurements) {
    const procurements = await client.query('SELECT COUNT(*)::int AS count FROM procurements WHERE created_by_id = $1', [userId]);
    count.procurements = procurements.rows[0]?.count ?? 0;
  }

  if (select.reviewed_procurements) {
    const reviewed = await client.query('SELECT COUNT(*)::int AS count FROM procurements WHERE reviewed_by_id = $1', [userId]);
    count.reviewed_procurements = reviewed.rows[0]?.count ?? 0;
  }

  if (select.projects) {
    const projects = await client.query('SELECT COUNT(*)::int AS count FROM projects_project WHERE created_by_id = $1', [userId]);
    count.projects = projects.rows[0]?.count ?? 0;
  }

  return count;
}

export const dbDirect = {
  user: {
    findUnique: async (where: { email?: string; id?: string; where?: { email?: string; id?: string } }) => {
      const filter = where.where ?? where;
      const client = await pool.connect();
      try {
        if (filter.email) {
          const result = await client.query(`SELECT * FROM ${USERS_TABLE} WHERE email = $1`, [filter.email]);
          return result.rows[0] || null;
        }
        if (filter.id) {
          const result = await client.query(`SELECT * FROM ${USERS_TABLE} WHERE id = $1`, [filter.id]);
          return result.rows[0] || null;
        }
        return null;
      } finally {
        client.release();
      }
    },

    findFirst: async (params: UserQueryParams = {}) => {
      const client = await pool.connect();
      try {
        const result = await client.query(`SELECT * FROM ${USERS_TABLE}`);
        const rows = result.rows.filter((row) => matchesWhere(row, params.where ?? params));
        const sorted = sortRows(rows, params.orderBy);
        const row = applyTake(sorted, { take: 1 })[0] || null;
        if (!row) return null;

        const hydrated = pickUser(row, params.select);
        if (params.select?._count) {
          hydrated._count = await buildUserCount(client, row.id, params.select._count.select ?? params.select._count);
        }
        return hydrated;
      } finally {
        client.release();
      }
    },

    findMany: async (params: UserQueryParams = {}) => {
      const client = await pool.connect();
      try {
        const result = await client.query(`SELECT * FROM ${USERS_TABLE}`);
        const filtered = result.rows.filter((row) => matchesWhere(row, params.where ?? params));
        const sorted = sortRows(filtered, params.orderBy);
        const limited = applyTake(sorted, params);

        if (!params.select) return limited;

        const mapped = [] as any[];
        for (const row of limited) {
          const selected = pickUser(row, params.select);
          if (params.select._count) {
            selected._count = await buildUserCount(client, row.id, params.select._count.select ?? params.select._count);
          }
          mapped.push(selected);
        }
        return mapped;
      } finally {
        client.release();
      }
    },

    count: async (params: UserQueryParams = {}) => {
      const client = await pool.connect();
      try {
        const result = await client.query(`SELECT * FROM ${USERS_TABLE}`);
        return result.rows.filter((row) => matchesWhere(row, params.where ?? params)).length;
      } finally {
        client.release();
      }
    },

    create: async (params: any) => {
      const data = params.data || params;

      const client = await pool.connect();
      try {
        const result = await client.query(
          `INSERT INTO ${USERS_TABLE} (
              id, full_name, email, password_hash, role, status,
              company_name, company_address, phone, business_type,
              representative_name, tin, company_profile, supporting_documents,
              business_permit_document, philgeps_registration, philgeps_registration_expiry, bir_form_2303,
              valid_id, valid_id_type, valid_id_number, representative_job_title,
              iso_certificate_type, iso_certificate, iso_certificate_expiry,
              bank_name, bank_account_name, bank_account_number,
              not_blacklisted_declaration, blacklisting_declaration_document,
              audited_financial_statements, financial_statement_year, bank_reference_document,
              performance_certificates, representative_authorization_document,
              created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, NOW(), NOW())
            RETURNING *`,
            [
              data.id || uuid(),
              data.full_name,
              data.email,
              data.password_hash,
              data.role || 'supplier',
              data.status || 'pending',
              data.company_name,
              data.company_address || '',
              data.phone || '',
              data.business_type || 'Other',
              data.representative_name || null,
              data.tin || null,
              data.company_profile || null,
              data.supporting_documents || null,
              data.business_permit_document || null,
              data.philgeps_registration || null,
              data.philgeps_registration_expiry || null,
              data.bir_form_2303 || null,
              data.valid_id || null,
              data.valid_id_type || null,
              data.valid_id_number || null,
              data.representative_job_title || null,
              data.iso_certificate_type || null,
              data.iso_certificate || null,
              data.iso_certificate_expiry || null,
              data.bank_name || null,
              data.bank_account_name || null,
              data.bank_account_number || null,
              data.not_blacklisted_declaration ?? false,
              data.blacklisting_declaration_document || null,
              data.audited_financial_statements || null,
              data.financial_statement_year || null,
              data.bank_reference_document || null,
              data.performance_certificates || null,
              data.representative_authorization_document || null,
            ]
        );
        return result.rows[0];
      } finally {
        client.release();
      }
    },

    update: async (whereOrParams: any, dataArg?: any) => {
      const { id, data } = normalizeUpdateArgs(whereOrParams, dataArg);
      if (!id) {
        throw new Error('Update requires an id-based where clause.');
      }

      const updateData = isPlainObject(data) ? data : {};
      const client = await pool.connect();
      try {
        const entries = Object.entries(updateData);
        if (!entries.length) {
          return await dbDirect.user.findUnique({ id });
        }

        const assignments = entries.map(([key], index) => `"${key}" = $${index + 2}`).join(', ');
        const values = entries.map(([, value]) => value);
        const result = await client.query(
          `UPDATE ${USERS_TABLE} SET ${assignments}, updated_at = NOW() WHERE id = $1 RETURNING *`,
          [id, ...values]
        );
        return result.rows[0] || null;
      } finally {
        client.release();
      }
    },

    delete: async (whereOrParams: any) => {
      const id = whereOrParams?.id ?? whereOrParams?.where?.id;
      if (!id) {
        throw new Error('Delete requires an id-based where clause.');
      }

      const client = await pool.connect();
      try {
        const result = await client.query(`DELETE FROM ${USERS_TABLE} WHERE id = $1 RETURNING *`, [id]);
        return result.rows[0] || null;
      } finally {
        client.release();
      }
    },
  },

  blockchainRecord: {
    findMany: async (params: { where?: Record<string, any>; orderBy?: any; take?: number; limit?: number } = {}) => {
      const client = await pool.connect();
      try {
        const q = `SELECT b.*, p.id AS p_id, p.title AS p_title, p.procurement_type AS p_procurement_type, p.budget AS p_budget, p.deadline AS p_deadline, p.public_result_expiry_date AS p_public_result_expiry_date, p.awarded_at AS p_awarded_at, p.updated_at AS p_updated_at, w.full_name AS winner_full_name, w.company_name AS winner_company_name, bd.bid_amount AS bid_bid_amount, bd.submitted_at AS bid_submitted_at, bd.company_name AS bid_company_name FROM blockchain_blockchainrecord b LEFT JOIN projects_project p ON p.id = b.project_id LEFT JOIN users w ON w.id = b.winner_id LEFT JOIN bids_bid bd ON bd.id = b.bid_id`;
        const result = await client.query(q);
        let rows = result.rows;
        // simple where filtering by top-level fields
        if (params.where) rows = rows.filter((r) => matchesWhere(r, params.where));
        rows = sortRows(rows, params.orderBy);
        rows = applyTake(rows, params);

        return rows.map((r) => ({
          id: r.id,
          project_id: r.project_id,
          bid_id: r.bid_id,
          winner_id: r.winner_id,
          recorded_at: r.recorded_at,
          hash: r.hash,
          project: r.p_id ? {
            id: r.p_id,
            title: r.p_title,
            procurement_type: r.p_procurement_type,
            budget: r.p_budget,
            deadline: r.p_deadline,
            public_result_expiry_date: r.p_public_result_expiry_date,
            awarded_at: r.p_awarded_at,
            updated_at: r.p_updated_at,
          } : null,
          winner: r.winner_full_name || r.winner_company_name ? { full_name: r.winner_full_name, company_name: r.winner_company_name } : null,
          bid: r.bid_bid_amount != null ? { bid_amount: r.bid_bid_amount, submitted_at: r.bid_submitted_at, company_name: r.bid_company_name } : null,
        }));
      } finally {
        client.release();
      }
    }
  },

  notification: {
    findUnique: async (params: { where?: { id?: string; recipient_id?: string; is_read?: boolean } } = {}) => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM notifications');
        const row = result.rows.find((item) => matchesWhere(item, params.where ?? params)) || null;
        return hydrateNotification(row);
      } finally {
        client.release();
      }
    },


  businessType: {
    findMany: async (params: { where?: Record<string, any>; orderBy?: any; take?: number; limit?: number } = {}) => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM business_types');
        let rows = result.rows.filter((row) => matchesBusinessTypeWhere(row, params.where ?? params));
        rows = sortRows(rows, params.orderBy);
        rows = applyTake(rows, params);
        return rows;
      } finally {
        client.release();
      }
    },

    findUnique: async (where: { id?: string; where?: { id?: string } }) => {
      const filter = where.where ?? where;
      const client = await pool.connect();
      try {
        if (filter.id) {
          const res = await client.query('SELECT * FROM business_types WHERE id = $1', [filter.id]);
          return res.rows[0] || null;
        }
        return null;
      } finally {
        client.release();
      }
    },

    findFirst: async (params: { where?: Record<string, any>; orderBy?: any } = {}) => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM business_types');
        const filtered = result.rows.filter((row) => matchesBusinessTypeWhere(row, params.where ?? params));
        const sorted = sortRows(filtered, params.orderBy);
        return (applyTake(sorted, { take: 1 })[0]) || null;
      } finally {
        client.release();
      }
    },

    create: async (params: any) => {
      const data = params.data || params;
      const client = await pool.connect();
      try {
        const id = data.id || uuid();
        const result = await client.query(
          `INSERT INTO business_types (id, name, description, is_active, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
          [id, data.name, data.description ?? null, data.is_active ?? true]
        );
        return result.rows[0];
      } finally {
        client.release();
      }
    },
  },

  supplierBusinessType: {
    findMany: async (params: { where?: Record<string, any>; include?: Record<string, any>; orderBy?: any; take?: number; limit?: number } = {}) => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM supplier_business_types');
        let rows = result.rows.filter((row) => matchesWhere(row, params.where ?? params));
        rows = sortRows(rows, params.orderBy);
        rows = applyTake(rows, params);

        if (params.include?.business_type) {
          const includeSelect = params.include.business_type.select;
          const mapped = [] as any[];
          for (const row of rows) {
            const bt = row.business_type_id ? await client.query('SELECT * FROM business_types WHERE id = $1', [row.business_type_id]) : { rows: [] };
            const business_type = bt.rows[0] || null;
            const includedBusinessType = business_type && includeSelect ? Object.fromEntries(Object.entries(includeSelect).filter(([, enabled]) => enabled).map(([key]) => [key, business_type[key]])) : business_type;
            mapped.push({ ...row, business_type: includedBusinessType });
          }
          return mapped;
        }

        return rows;
      } finally {
        client.release();
      }
    },

    createMany: async (params: { data?: any[]; skipDuplicates?: boolean } = {}) => {
      const data = params.data || [];
      const client = await pool.connect();
      try {
        let count = 0;
        for (const item of data) {
          try {
            await client.query(
              `INSERT INTO supplier_business_types (supplier_id, business_type_id, created_at) VALUES ($1, $2, NOW())`,
              [item.supplier_id, item.business_type_id]
            );
            count += 1;
          } catch (err: any) {
            if (!params.skipDuplicates) throw err;
          }
        }
        return { count };
      } finally {
        client.release();
      }
    },

    deleteMany: async (params: { where?: Record<string, any> } = {}) => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM supplier_business_types');
        const rows = result.rows.filter((row) => matchesWhere(row, params.where ?? params));
        let count = 0;
        for (const row of rows) {
          await client.query('DELETE FROM supplier_business_types WHERE supplier_id = $1 AND business_type_id = $2', [row.supplier_id, row.business_type_id]);
          count += 1;
        }
        return { count };
      } finally {
        client.release();
      }
    },
  },
    findFirst: async (params: { where?: Record<string, any>; orderBy?: Record<string, 'asc' | 'desc'> | Array<Record<string, 'asc' | 'desc'>>; take?: number; limit?: number; select?: Record<string, any> } = {}) => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM notifications');
        const filtered = result.rows.filter((row) => matchesWhere(row, params.where ?? params));
        const sorted = sortRows(filtered, params.orderBy);
        const row = applyTake(sorted, { take: 1 })[0] || null;
        return hydrateNotification(row);
      } finally {
        client.release();
      }
    },

    findMany: async (params: { where?: Record<string, any>; orderBy?: Record<string, 'asc' | 'desc'> | Array<Record<string, 'asc' | 'desc'>>; take?: number; limit?: number; select?: Record<string, any> } = {}) => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM notifications');
        const filtered = result.rows.filter((row) => matchesWhere(row, params.where ?? params));
        const sorted = sortRows(filtered, params.orderBy);
        const limited = applyTake(sorted, params);
        return limited.map(hydrateNotification);
      } finally {
        client.release();
      }
    },

    count: async (params: { where?: Record<string, any> } = {}) => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM notifications');
        return result.rows.filter((row) => matchesWhere(row, params.where ?? params)).length;
      } finally {
        client.release();
      }
    },

    create: async (params: any) => {
      const data = params.data || params;
      const client = await pool.connect();
      try {
        const result = await client.query(
          `INSERT INTO notifications (
            id, recipient_id, type, title, message, is_read,
            link, related_id, resource_type, resource_id, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
          RETURNING *`,
          [
            data.id || uuid(),
            data.recipient_id,
            data.type,
            data.title,
            data.message,
            data.is_read ?? false,
            data.link ?? null,
            data.related_id ?? null,
            data.resource_type ?? null,
            data.resource_id ?? null,
          ]
        );
        return hydrateNotification(result.rows[0]);
      } finally {
        client.release();
      }
    },

    update: async (whereOrParams: any, dataArg?: any) => {
      const { id, data } = normalizeUpdateArgs(whereOrParams, dataArg);
      if (!id) {
        throw new Error('Update requires an id-based where clause.');
      }

      const updateData = isPlainObject(data) ? data : {};
      const client = await pool.connect();
      try {
        const entries = Object.entries(updateData);
        if (!entries.length) {
          return await dbDirect.notification.findUnique({ where: { id } });
        }

        const assignments = entries.map(([key], index) => `"${key}" = $${index + 2}`).join(', ');
        const values = entries.map(([, value]) => value);
        const result = await client.query(
          `UPDATE notifications SET ${assignments} WHERE id = $1 RETURNING *`,
          [id, ...values]
        );
        return hydrateNotification(result.rows[0] || null);
      } finally {
        client.release();
      }
    },

    updateMany: async (params: { where?: Record<string, any>; data?: Record<string, any> }) => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM notifications');
        const matches = result.rows.filter((row) => matchesWhere(row, params.where));
        for (const row of matches) {
          const updateData = isPlainObject(params.data) ? params.data : {};
          const entries = Object.entries(updateData);
          if (!entries.length) continue;

          const assignments = entries.map(([key], index) => `"${key}" = $${index + 2}`).join(', ');
          const values = entries.map(([, value]) => value);
          const updateResult = await client.query(
            `UPDATE notifications SET ${assignments} WHERE id = $1 RETURNING *`,
            [row.id, ...values]
          );
          if (!updateResult.rows[0]) {
            throw new Error('Failed to update notification.');
          }
        }
        return { count: matches.length };
      } finally {
        client.release();
      }
    },
  },

  businessType: {
    findMany: async (params: { where?: Record<string, any>; orderBy?: any; take?: number; limit?: number } = {}) => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM business_types');
        let rows = result.rows.filter((row) => matchesBusinessTypeWhere(row, params.where ?? params));
        rows = sortRows(rows, params.orderBy);
        rows = applyTake(rows, params);
        return rows;
      } finally {
        client.release();
      }
    },

    findUnique: async (where: { id?: string; where?: { id?: string } }) => {
      const filter = where.where ?? where;
      const client = await pool.connect();
      try {
        if (filter.id) {
          const res = await client.query('SELECT * FROM business_types WHERE id = $1', [filter.id]);
          return res.rows[0] || null;
        }
        return null;
      } finally {
        client.release();
      }
    },

    findFirst: async (params: { where?: Record<string, any>; orderBy?: any } = {}) => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM business_types');
        const filtered = result.rows.filter((row) => matchesBusinessTypeWhere(row, params.where ?? params));
        const sorted = sortRows(filtered, params.orderBy);
        return (applyTake(sorted, { take: 1 })[0]) || null;
      } finally {
        client.release();
      }
    },

    create: async (params: any) => {
      const data = params.data || params;
      const client = await pool.connect();
      try {
        const id = data.id || uuid();
        const result = await client.query(
          `INSERT INTO business_types (id, name, description, is_active, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
          [id, data.name, data.description ?? null, data.is_active ?? true]
        );
        return result.rows[0];
      } finally {
        client.release();
      }
    },
  },

  supplierBusinessType: {
    findMany: async (params: { where?: Record<string, any>; include?: Record<string, any>; orderBy?: any; take?: number; limit?: number } = {}) => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM supplier_business_types');
        let rows = result.rows.filter((row) => matchesWhere(row, params.where ?? params));
        rows = sortRows(rows, params.orderBy);
        rows = applyTake(rows, params);

        if (params.include?.business_type) {
          const includeSelect = params.include.business_type.select;
          const mapped = [] as any[];
          for (const row of rows) {
            const bt = row.business_type_id ? await client.query('SELECT * FROM business_types WHERE id = $1', [row.business_type_id]) : { rows: [] };
            const business_type = bt.rows[0] || null;
            const includedBusinessType = business_type && includeSelect ? Object.fromEntries(Object.entries(includeSelect).filter(([, enabled]) => enabled).map(([key]) => [key, business_type[key]])) : business_type;
            mapped.push({ ...row, business_type: includedBusinessType });
          }
          return mapped;
        }

        return rows;
      } finally {
        client.release();
      }
    },

    createMany: async (params: { data?: any[]; skipDuplicates?: boolean } = {}) => {
      const data = params.data || [];
      const client = await pool.connect();
      try {
        let count = 0;
        for (const item of data) {
          try {
            await client.query(
              `INSERT INTO supplier_business_types (supplier_id, business_type_id, created_at) VALUES ($1, $2, NOW())`,
              [item.supplier_id, item.business_type_id]
            );
            count += 1;
          } catch (err: any) {
            if (!params.skipDuplicates) throw err;
          }
        }
        return { count };
      } finally {
        client.release();
      }
    },

    deleteMany: async (params: { where?: Record<string, any> } = {}) => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM supplier_business_types');
        const rows = result.rows.filter((row) => matchesWhere(row, params.where ?? params));
        let count = 0;
        for (const row of rows) {
          await client.query('DELETE FROM supplier_business_types WHERE supplier_id = $1 AND business_type_id = $2', [row.supplier_id, row.business_type_id]);
          count += 1;
        }
        return { count };
      } finally {
        client.release();
      }
    },
  },

  documentUpload: {
    findMany: async (params: { where?: Record<string, any>; orderBy?: Record<string, 'asc' | 'desc'> | Array<Record<string, 'asc' | 'desc'>>; take?: number; limit?: number } = {}) => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM document_uploads');
        const filtered = result.rows.filter((row) => matchesWhere(row, params.where ?? params));
        const sorted = sortRows(filtered, params.orderBy);
        const limited = applyTake(sorted, params);
        return limited.map(hydrateDocumentUpload);
      } finally {
        client.release();
      }
    },

    create: async (params: any) => {
      const data = params.data || params;
      const client = await pool.connect();
      try {
        const result = await client.query(
          `INSERT INTO document_uploads (
            id, user_id, document_type, file_name, file, file_size,
            verification_status, verification_notes, verified_by_id, verified_at,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
          RETURNING *`,
          [
            data.id || uuid(),
            data.user_id,
            data.document_type,
            data.file_name,
            data.file || null,
            data.file_size ?? 0,
            data.verification_status || 'Pending',
            data.verification_notes ?? null,
            data.verified_by_id ?? null,
            data.verified_at ?? null,
          ]
        );
        return hydrateDocumentUpload(result.rows[0]);
      } finally {
        client.release();
      }
    },

    update: async (whereOrParams: any, dataArg?: any) => {
      const { id, data } = normalizeUpdateArgs(whereOrParams, dataArg);
      if (!id) {
        throw new Error('Update requires an id-based where clause.');
      }

      const updateData = isPlainObject(data) ? data : {};
      const client = await pool.connect();
      try {
        const entries = Object.entries(updateData);
        if (!entries.length) {
          const result = await client.query('SELECT * FROM document_uploads WHERE id = $1', [id]);
          return hydrateDocumentUpload(result.rows[0] || null);
        }

        const assignments = entries.map(([key], index) => `"${key}" = $${index + 2}`).join(', ');
        const values = entries.map(([, value]) => value);
        const result = await client.query(
          `UPDATE document_uploads SET ${assignments}, updated_at = NOW() WHERE id = $1 RETURNING *`,
          [id, ...values]
        );
        return hydrateDocumentUpload(result.rows[0] || null);
      } finally {
        client.release();
      }
    },
  },

  bid: {
    count: async (params: { where?: Record<string, any> } = {}) => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM bids_bid');
        return result.rows.filter((row) => matchesWhere(row, params.where ?? params)).length;
      } finally {
        client.release();
      }
    },

    findMany: async (params: { where?: Record<string, any>; orderBy?: any; take?: number; limit?: number; select?: Record<string, any> } = {}) => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM bids_bid');
        let rows = result.rows.filter((row) => matchesWhere(row, params.where ?? params));
        rows = sortRows(rows, params.orderBy);
        rows = applyTake(rows, params);
        return rows;
      } finally {
        client.release();
      }
    },

    findUnique: async (where: { id?: string; where?: { id?: string } }) => {
      const filter = where.where ?? where;
      const client = await pool.connect();
      try {
        if (filter.id) {
          const res = await client.query('SELECT * FROM bids_bid WHERE id = $1', [filter.id]);
          return res.rows[0] || null;
        }
        return null;
      } finally {
        client.release();
      }
    },

    findFirst: async (params: { where?: Record<string, any>; orderBy?: any } = {}) => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM bids_bid');
        const filtered = result.rows.filter((row) => matchesWhere(row, params.where ?? params));
        const sorted = sortRows(filtered, params.orderBy);
        return (applyTake(sorted, { take: 1 })[0]) || null;
      } finally {
        client.release();
      }
    },

    create: async (params: any) => {
      const data = params.data || params;
      const client = await pool.connect();
      try {
        const id = data.id || uuid();
        const updatedAt = data.updated_at ?? new Date().toISOString();
        const result = await client.query(
          `INSERT INTO bids_bid (
            id, project_id, supplier_id, company_name, bid_amount, proposal,
            quotation_file, quotation_document, technical_proposal, supporting_documents,
            technical_document, no_conflict_of_interest, conflict_of_interest_person,
            no_past_scm_issues, status, technical_compliance, evaluation_remarks, rank,
            recorded, updated_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) RETURNING *`,
          [
            id,
            data.project_id,
            data.supplier_id,
            data.company_name ?? "",
            data.bid_amount ?? null,
            data.proposal ?? "",
            data.quotation_file ?? null,
            data.quotation_document ?? data.quotation_file ?? null,
            data.technical_proposal ?? null,
            data.supporting_documents ?? null,
            data.technical_document ?? null,
            data.no_conflict_of_interest ?? false,
            data.conflict_of_interest_person ?? null,
            data.no_past_scm_issues ?? false,
            data.status ?? 'submitted',
            data.technical_compliance ?? false,
            data.evaluation_remarks ?? "",
            data.rank ?? null,
            data.recorded ?? false,
            updatedAt,
          ]
        );
        return result.rows[0];
      } finally {
        client.release();
      }
    },

    update: async (whereOrParams: any, dataArg?: any) => {
      const id = whereOrParams?.id ?? whereOrParams?.where?.id;
      const data = dataArg ?? whereOrParams?.data ?? whereOrParams;
      if (!id) throw new Error('Update requires id');
      const client = await pool.connect();
      try {
        const entries = Object.entries(data);
        if (!entries.length) {
          const res = await client.query('SELECT * FROM bids_bid WHERE id = $1', [id]);
          return res.rows[0] || null;
        }
        const assignments = entries.map(([k], i) => `"${k}" = $${i + 2}`).join(', ');
        const values = entries.map(([, v]) => v);
        const res = await client.query(`UPDATE bids_bid SET ${assignments} WHERE id = $1 RETURNING *`, [id, ...values]);
        return res.rows[0] || null;
      } finally {
        client.release();
      }
    }
  },

  project: {
    count: async (params: { where?: Record<string, any> } = {}) => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM projects_project');
        return result.rows.filter((row) => matchesWhere(row, params.where ?? params)).length;
      } finally {
        client.release();
      }
    },

    findMany: async (params: { where?: Record<string, any>; orderBy?: any; take?: number; limit?: number } = {}) => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM projects_project');
        let rows = result.rows.filter((row) => matchesWhere(row, params.where ?? params));
        rows = sortRows(rows, params.orderBy);
        rows = applyTake(rows, params);
        return rows;
      } finally {
        client.release();
      }
    },

    findUnique: async (where: { id?: string; where?: { id?: string } }) => {
      const filter = where.where ?? where;
      const client = await pool.connect();
      try {
        if (filter.id) {
          const res = await client.query('SELECT * FROM projects_project WHERE id = $1', [filter.id]);
          return res.rows[0] || null;
        }
        return null;
      } finally {
        client.release();
      }
    },

    findFirst: async (params: { where?: Record<string, any>; orderBy?: any } = {}) => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM projects_project');
        const filtered = result.rows.filter((row) => matchesWhere(row, params.where ?? params));
        const sorted = sortRows(filtered, params.orderBy);
        return (applyTake(sorted, { take: 1 })[0]) || null;
      } finally {
        client.release();
      }
    },

    create: async (params: any) => {
      const data = params.data || params;
      const client = await pool.connect();
      try {
        const id = data.id || uuid();
        const result = await client.query(
          `INSERT INTO projects_project (
            id, procurement_request_id, title, budget, deadline, procurement_schedule,
            public_result_expiry_date, requirements, procurement_type, delivery_period,
            technical_specifications, status, is_archived, archived_at, archived_reason,
            published_at, awarded_at, created_by_id, updated_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18, NOW()) RETURNING *`,
          [
            id,
            data.procurement_request_id ?? null,
            data.title ?? null,
            data.budget ?? null,
            data.deadline ?? null,
            data.procurement_schedule ?? null,
            data.public_result_expiry_date ?? null,
            data.requirements ?? null,
            data.procurement_type ?? null,
            data.delivery_period ?? null,
            data.technical_specifications ?? null,
            data.status ?? 'draft',
            data.is_archived ?? false,
            data.archived_at ?? null,
            data.archived_reason ?? null,
            data.published_at ?? null,
            data.awarded_at ?? null,
            data.created_by_id ?? null,
          ]
        );
        return result.rows[0];
      } finally {
        client.release();
      }
    },

    update: async (whereOrParams: any, dataArg?: any) => {
      const id = whereOrParams?.id ?? whereOrParams?.where?.id;
      const data = dataArg ?? whereOrParams?.data ?? whereOrParams;
      if (!id) throw new Error('Update requires id');
      const client = await pool.connect();
      try {
        const entries = Object.entries(data);
        if (!entries.length) {
          const res = await client.query('SELECT * FROM projects_project WHERE id = $1', [id]);
          return res.rows[0] || null;
        }
        const assignments = entries.map(([k], i) => `"${k}" = $${i + 2}`).join(', ');
        const values = entries.map(([, v]) => v);
        const res = await client.query(`UPDATE projects_project SET ${assignments}, updated_at = NOW() WHERE id = $1 RETURNING *`, [id, ...values]);
        return res.rows[0] || null;
      } finally {
        client.release();
      }
    }
  }
};