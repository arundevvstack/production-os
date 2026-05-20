require('dotenv').config();
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();

  // Add gen_random_uuid() default to tables whose id has no default
  const tables = ['Prospect', 'Project', 'Objective', 'Proposal', 'Invoice', 
    'Expense', 'Asset', 'Deliverable', 'Archive', 'ActivityLog', 'Approval',
    'Booking', 'Comment', 'CommunicationLog', 'GSTFiling', 'Meeting', 
    'Milestone', 'Notification', 'ObjectiveDependency', 'ProductionLog',
    'ProjectStage', 'Resource', 'TimeEntry', 'UserTeam'];

  for (const tbl of tables) {
    try {
      const res = await client.query(`
        SELECT column_default FROM information_schema.columns 
        WHERE table_schema='public' AND table_name=$1 AND column_name='id';
      `, [tbl]);
      
      if (res.rows.length > 0 && !res.rows[0].column_default) {
        await client.query(`ALTER TABLE public."${tbl}" ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;`);
        console.log(`✓ Set uuid default on ${tbl}.id`);
      } else {
        console.log(`- ${tbl}.id already has default: ${res.rows[0]?.column_default}`);
      }
    } catch (e) {
      console.log(`✗ Error on ${tbl}: ${e.message}`);
    }
  }

  // Also add missing fields to Project table if needed
  const projectCols = await client.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='Project';
  `);
  const projectColNames = projectCols.rows.map(r => r.column_name);
  
  const missingProjectCols = {
    'client_name': 'TEXT',
    'service_category': 'TEXT',
    'service_type': 'TEXT',
    'description': 'TEXT',
    'start_date': 'TIMESTAMP',
    'crew_members': 'JSONB',
    'notes': 'TEXT',
  };

  for (const [col, type] of Object.entries(missingProjectCols)) {
    if (!projectColNames.includes(col)) {
      await client.query(`ALTER TABLE public."Project" ADD COLUMN IF NOT EXISTS "${col}" ${type};`);
      console.log(`✓ Added Project.${col}`);
    }
  }

  await client.end();
  console.log('\nAll done!');
}

main().catch(e => { console.error(e); client.end(); });
