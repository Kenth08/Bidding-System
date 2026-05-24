import { Pool } from 'pg';
import { v4 as uuid } from 'uuid';

// Direct PostgreSQL connection (bypass Supabase API issues)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export const dbDirect = {
  user: {
    findUnique: async (where: { email?: string; id?: string }) => {
      const client = await pool.connect();
      try {
        if (where.email) {
          const result = await client.query(
            'SELECT * FROM users WHERE email = $1',
            [where.email]
          );
          return result.rows[0] || null;
        }
        if (where.id) {
          const result = await client.query(
            'SELECT * FROM users WHERE id = $1',
            [where.id]
          );
          return result.rows[0] || null;
        }
        return null;
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
    }
  }
};