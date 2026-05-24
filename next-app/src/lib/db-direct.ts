import { Pool } from 'pg';
import { v4 as uuid } from 'uuid';

// Direct PostgreSQL connection (bypass Supabase API issues)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

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

function matchesWhere(row: any, where?: Record<string, any>) {
  if (!where) return true;
  return Object.entries(where).every(([key, expected]) => {
    if (expected === undefined) return true;
    return row?.[key] === expected;
  });
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
          const result = await client.query(
            'SELECT * FROM users WHERE email = $1',
            [filter.email]
          );
          return result.rows[0] || null;
        }
        if (filter.id) {
          const result = await client.query(
            'SELECT * FROM users WHERE id = $1',
            [filter.id]
          );
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
        const result = await client.query('SELECT * FROM users');
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
        const result = await client.query('SELECT * FROM users');
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
        const result = await client.query('SELECT * FROM users');
        return result.rows.filter((row) => matchesWhere(row, params.where ?? params)).length;
      } finally {
        client.release();
      }
    },

    create: async (params: any) => {
      // Handle Prisma-style { data: { ... } } or direct data object
      const data = params.data || params;
      
      const client = await pool.connect();
      try {
        const result = await client.query(
          `INSERT INTO users (
            id, full_name, email, password_hash, role, status,
            company_name, company_address, phone, business_type,
            business_permit_document, philgeps_registration, tax_clearance, valid_id,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
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
            data.business_permit_document || null,
            data.philgeps_registration || null,
            data.tax_clearance || null,
            data.valid_id || null
          ]
        );
        return result.rows[0];
      } finally {
        client.release();
      }
    },

    update: async (where: { id: string }, data: any) => {
      const client = await pool.connect();
      try {
        const entries = Object.entries(data);
        if (!entries.length) {
          return await dbDirect.user.findUnique({ id: where.id });
        }

        const assignments = entries.map(([key], index) => `"${key}" = $${index + 2}`).join(', ');
        const values = entries.map(([, value]) => value);
        const result = await client.query(
          `UPDATE users SET ${assignments}, updated_at = NOW() WHERE id = $1 RETURNING *`,
          [where.id, ...values]
        );
        return result.rows[0] || null;
      } finally {
        client.release();
      }
    }
  }
};