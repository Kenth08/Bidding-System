const { Client } = require('pg');
(async () => {
  const conn = process.env.DATABASE_URL;
  if (!conn) {
    console.error('DATABASE_URL not set');
    process.exit(2);
  }
  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('Connected to DB');

    // Inspect columns
    async function cols(table) {
      const res = await client.query("SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1", [table]);
      return res.rows;
    }

    console.log('\ndocument_uploads columns:');
    console.table(await cols('document_uploads'));

    console.log('\nnotifications columns:');
    console.table(await cols('notifications'));

    // Apply fixes
    const statements = [
      "ALTER TABLE document_uploads ALTER COLUMN updated_at SET DEFAULT now();",
      "ALTER TABLE document_uploads ALTER COLUMN created_at SET DEFAULT now();",
    ];

    for (const s of statements) {
      try {
        console.log('Running:', s);
        await client.query(s);
        console.log('OK');
      } catch (e) {
        console.error('Failed:', e.message);
      }
    }

    // Check if notifications has the columns expected by the current app code
    const notifCols = await cols('notifications');
    const hasRecipient = notifCols.some(c => c.column_name === 'recipient_id');
    if (!hasRecipient) {
      console.log('notifications table missing recipient_id; adding nullable recipient_id UUID column');
      try {
        await client.query("ALTER TABLE notifications ADD COLUMN recipient_id uuid NULL;");
        console.log('Added recipient_id column');
      } catch (e) {
        console.error('Failed to add recipient_id:', e.message);
      }
    } else {
      console.log('notifications has recipient_id; nothing to add');
    }

    const notifColsAfterRecipient = await cols('notifications');
    const addIfMissing = async (columnSql, columnName) => {
      if (notifColsAfterRecipient.some(c => c.column_name === columnName)) return;
      try {
        console.log(`Adding notifications.${columnName}`);
        await client.query(columnSql);
        console.log(`Added ${columnName}`);
      } catch (e) {
        console.error(`Failed to add ${columnName}:`, e.message);
      }
    };

    await addIfMissing("ALTER TABLE notifications ADD COLUMN type text NULL;", 'type');
    await addIfMissing("ALTER TABLE notifications ADD COLUMN title text NULL;", 'title');
    await addIfMissing("ALTER TABLE notifications ADD COLUMN link text NULL;", 'link');
    await addIfMissing("ALTER TABLE notifications ADD COLUMN related_id text NULL;", 'related_id');
    await addIfMissing("ALTER TABLE notifications ADD COLUMN resource_type text NULL;", 'resource_type');
    await addIfMissing("ALTER TABLE notifications ADD COLUMN resource_id text NULL;", 'resource_id');

    console.log('\nprocurements columns:');
    console.table(await cols('procurements'));

    const procurementCols = await cols('procurements');
    const addProcurementIfMissing = async (columnSql, columnName) => {
      if (procurementCols.some(c => c.column_name === columnName)) return;
      try {
        console.log(`Adding procurements.${columnName}`);
        await client.query(columnSql);
        console.log(`Added ${columnName}`);
      } catch (e) {
        console.error(`Failed to add ${columnName}:`, e.message);
      }
    };

    await addProcurementIfMissing("ALTER TABLE procurements ADD COLUMN project_title text NULL;", 'project_title');
    await addProcurementIfMissing("ALTER TABLE procurements ADD COLUMN deadline timestamptz NULL;", 'deadline');
    await addProcurementIfMissing("ALTER TABLE procurements ADD COLUMN public_result_expiry_date timestamptz NULL;", 'public_result_expiry_date');
    await addProcurementIfMissing("ALTER TABLE procurements ADD COLUMN procurement_type text NULL;", 'procurement_type');
    await addProcurementIfMissing("ALTER TABLE procurements ADD COLUMN technical_specifications text NULL;", 'technical_specifications');
    await addProcurementIfMissing("ALTER TABLE procurements ADD COLUMN procurement_schedule text NULL;", 'procurement_schedule');
    await addProcurementIfMissing("ALTER TABLE procurements ADD COLUMN delivery_period text NULL;", 'delivery_period');
    await addProcurementIfMissing("ALTER TABLE procurements ADD COLUMN rejection_reason text NULL;", 'rejection_reason');
    await addProcurementIfMissing("ALTER TABLE procurements ADD COLUMN revision_notes text NULL;", 'revision_notes');
    await addProcurementIfMissing("ALTER TABLE procurements ADD COLUMN review_remarks text NULL;", 'review_remarks');
    await addProcurementIfMissing("ALTER TABLE procurements ADD COLUMN created_by_id uuid NULL;", 'created_by_id');
    await addProcurementIfMissing("ALTER TABLE procurements ADD COLUMN reviewed_by_id uuid NULL;", 'reviewed_by_id');
    await addProcurementIfMissing("ALTER TABLE procurements ADD COLUMN reviewed_at timestamptz NULL;", 'reviewed_at');
    await addProcurementIfMissing("ALTER TABLE procurements ADD COLUMN updated_at timestamptz NULL DEFAULT now();", 'updated_at');

    try {
      console.log('Rebuilding procurements_status_check to match app statuses');
      await client.query("ALTER TABLE procurements DROP CONSTRAINT IF EXISTS procurements_status_check;");
      await client.query(`ALTER TABLE procurements ADD CONSTRAINT procurements_status_check CHECK (status = ANY (ARRAY['Draft'::text, 'Pending Review'::text, 'Approved'::text, 'Rejected'::text, 'Revision Required'::text, 'open'::text, 'closed'::text, 'awarded'::text]));`);
      console.log('Rebuilt procurements_status_check');
    } catch (e) {
      console.error('Failed to rebuild procurements_status_check:', e.message);
    }

    console.log('Done');
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
