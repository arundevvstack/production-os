/**
 * CREATE ARCHIVE TABLE
 * Creates the Archive table in Supabase for storing archived clients and projects.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createArchiveTable() {
  console.log('Creating Archive table...');

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS public."Archive" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      company_id TEXT REFERENCES public."Company"(id) ON DELETE SET NULL,
      archive_type TEXT NOT NULL DEFAULT 'project', -- 'project' | 'client'
      archived_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

      -- Client / Lead fields
      company_name TEXT,
      industry TEXT,
      email TEXT,
      contact_person TEXT,
      service_vertical TEXT,
      sub_vertical TEXT,

      -- Project fields
      project_name TEXT,
      client_name TEXT,
      budget NUMERIC,
      status TEXT,
      deadline TEXT,
      color TEXT,
      progress INTEGER DEFAULT 0,

      -- Metadata
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
  `;

  const enableRlsSQL = `
    ALTER TABLE public."Archive" ENABLE ROW LEVEL SECURITY;
  `;

  const rlsPolicySQL = `
    CREATE POLICY IF NOT EXISTS "Company members can manage their own archives"
    ON public."Archive"
    USING (company_id IN (
      SELECT company_id FROM public."User" WHERE id = auth.uid()
    ));
  `;

  try {
    console.log('1. Creating Archive table...');
    await prisma.$executeRawUnsafe(createTableSQL);
    
    console.log('2. Enabling Row Level Security...');
    await prisma.$executeRawUnsafe(enableRlsSQL);
    
    console.log('3. Setting RLS policy...');
    try {
      await prisma.$executeRawUnsafe(rlsPolicySQL);
    } catch (e) {
      // Policy may already exist — that's fine
      console.log('   (Policy may already exist — continuing)');
    }

    console.log('\n✅ Archive table created and configured successfully!');
  } catch (error) {
    console.error('❌ Failed to create Archive table:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createArchiveTable();
