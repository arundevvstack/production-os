require('dotenv').config();
const admin = require('firebase-admin');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const SERVICE_ACCOUNT_PATH = path.join(process.cwd(), 'firebase-service-account.json');

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error('❌ Error: firebase-service-account.json not found!');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const fb = admin.firestore();
const prisma = new PrismaClient();

async function migrate() {
  console.log('🚀 Starting Critical Migration: Firebase -> Supabase (Postgres)');

  try {
    // 1. Migrate Companies
    console.log('--- Migrating Companies ---');
    const companiesSnapshot = await fb.collection('companies').get();
    for (const doc of companiesSnapshot.docs) {
      const data = doc.data();
      console.log(`Migrating Company: ${data.name || doc.id}`);
      await prisma.company.upsert({
        where: { id: doc.id },
        update: {
          name: data.name || 'Unnamed Company',
          onboardingStatus: data.onboardingStatus || 'completed',
          cin: data.cin || null,
          gstin: data.gstin || null,
          address: data.address || null,
          bank_details: data.bank_details || {},
          contact_email: data.contact_email || null,
          contact_phone: data.contact_phone || null,
          website: data.website || null,
          createdAt: data.createdAt?.toDate?.() || new Date(),
        },
        create: {
          id: doc.id,
          name: data.name || 'Unnamed Company',
          onboardingStatus: data.onboardingStatus || 'completed',
          cin: data.cin || null,
          gstin: data.gstin || null,
          address: data.address || null,
          bank_details: data.bank_details || {},
          contact_email: data.contact_email || null,
          contact_phone: data.contact_phone || null,
          website: data.website || null,
          createdAt: data.createdAt?.toDate?.() || new Date(),
        }
      });

      await migrateCompanySubcollections(doc.id);
    }

    // 2. Migrate Users
    console.log('--- Migrating Users ---');
    const usersSnapshot = await fb.collection('users').get();
    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      if (!data.company_id) continue;
      
      await prisma.user.upsert({
        where: { id: doc.id },
        update: {
          company_id: data.company_id,
          role_id: data.role_id || 'user',
          email: data.email,
          fullName: data.fullName || 'Unnamed User',
          status: data.status || 'active',
          createdAt: data.createdAt?.toDate?.() || new Date(),
        },
        create: {
          id: doc.id,
          company_id: data.company_id,
          role_id: data.role_id || 'user',
          email: data.email,
          fullName: data.fullName || 'Unnamed User',
          status: data.status || 'active',
          createdAt: data.createdAt?.toDate?.() || new Date(),
        }
      });
    }

    console.log('✅ Migration Completed Successfully!');
  } catch (error) {
    console.error('❌ Migration Failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function migrateCompanySubcollections(companyId) {
  // Leads
  const leadsSnapshot = await fb.collection('companies').doc(companyId).collection('leads').get();
  for (const doc of leadsSnapshot.docs) {
    const data = doc.data();
    await prisma.lead.upsert({
      where: { id: doc.id },
      update: {
        company_id: companyId,
        company_name: data.company_name || null,
        email: data.email || null,
        contact_person: data.contact_person || null,
        deal_value: Number(data.deal_value) || 0,
        stage: data.stage || 'new',
        created_at: data.created_at?.toDate?.() || new Date(),
      },
      create: {
        id: doc.id,
        company_id: companyId,
        company_name: data.company_name || null,
        email: data.email || null,
        contact_person: data.contact_person || null,
        deal_value: Number(data.deal_value) || 0,
        stage: data.stage || 'new',
        created_at: data.created_at?.toDate?.() || new Date(),
      }
    });
  }

  // Projects
  const projectsSnapshot = await fb.collection('companies').doc(companyId).collection('projects').get();
  for (const doc of projectsSnapshot.docs) {
    const data = doc.data();
    await prisma.project.upsert({
      where: { id: doc.id },
      update: {
        company_id: companyId,
        project_name: data.project_name || 'Unnamed Project',
        project_ref: data.project_ref || null,
        client_name: data.client_name || null,
        status: data.status || 'in_progress',
        progress: Number(data.progress) || 0,
        budget: Number(data.budget) || 0,
        deadline: data.deadline?.toDate?.() || (data.deadline ? new Date(data.deadline) : null),
        color: data.color || null,
        created_at: data.created_at?.toDate?.() || new Date(),
      },
      create: {
        id: doc.id,
        company_id: companyId,
        project_name: data.project_name || 'Unnamed Project',
        project_ref: data.project_ref || null,
        client_name: data.client_name || null,
        status: data.status || 'in_progress',
        progress: Number(data.progress) || 0,
        budget: Number(data.budget) || 0,
        deadline: data.deadline?.toDate?.() || (data.deadline ? new Date(data.deadline) : null),
        color: data.color || null,
        created_at: data.created_at?.toDate?.() || new Date(),
      }
    });

    // Sub-tasks
    const tasksSnapshot = await fb.collection('companies').doc(companyId).collection('projects').doc(doc.id).collection('tasks').get();
    for (const tDoc of tasksSnapshot.docs) {
        const tData = tDoc.data();
        await prisma.task.upsert({
            where: { id: tDoc.id },
            update: {
                project_id: doc.id,
                company_id: companyId,
                title: tData.title || 'Untitled Task',
                status: tData.status || 'pending',
                created_at: tData.created_at?.toDate?.() || new Date(),
            },
            create: {
                id: tDoc.id,
                project_id: doc.id,
                company_id: companyId,
                title: tData.title || 'Untitled Task',
                status: tData.status || 'pending',
                created_at: tData.created_at?.toDate?.() || new Date(),
            }
        });
    }
  }
}

migrate();
