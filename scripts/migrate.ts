import admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const { initializeApp, credential, firestore } = admin;

// --- CONFIGURATION ---
const SERVICE_ACCOUNT_PATH = path.join(process.cwd(), 'firebase-service-account.json');

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error('❌ Error: firebase-service-account.json not found!');
  console.log('Please download your service account key from Firebase Console -> Project Settings -> Service Accounts and save it as firebase-service-account.json in the root directory.');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

initializeApp({
  credential: credential.cert(serviceAccount)
});

const fb = firestore();
const prisma = new PrismaClient();

async function migrate() {
  console.log('🚀 Starting Critical Migration: Firebase -> Supabase (Postgres)');

  try {
    // 1. Migrate Companies
    console.log('--- Migrating Companies ---');
    const companiesSnapshot = await fb.collection('companies').get();
    for (const doc of companiesSnapshot.docs) {
      const data = doc.data();
      await prisma.company.upsert({
        where: { id: doc.id },
        update: {
          name: data.name,
          onboardingStatus: data.onboardingStatus || 'completed',
          cin: data.cin,
          gstin: data.gstin,
          address: data.address,
          bank_details: data.bank_details || {},
          contact_email: data.contact_email,
          contact_phone: data.contact_phone,
          website: data.website,
          createdAt: data.createdAt?.toDate() || new Date(),
        },
        create: {
          id: doc.id,
          name: data.name,
          onboardingStatus: data.onboardingStatus || 'completed',
          cin: data.cin,
          gstin: data.gstin,
          address: data.address,
          bank_details: data.bank_details || {},
          contact_email: data.contact_email,
          contact_phone: data.contact_phone,
          website: data.website,
          createdAt: data.createdAt?.toDate() || new Date(),
        }
      });

      // Migrate Sub-collections for this company
      await migrateCompanySubcollections(doc.id);
    }

    // 2. Migrate Global Users
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
          fullName: data.fullName,
          status: data.status || 'active',
          createdAt: data.createdAt?.toDate() || new Date(),
        },
        create: {
          id: doc.id,
          company_id: data.company_id,
          role_id: data.role_id || 'user',
          email: data.email,
          fullName: data.fullName,
          status: data.status || 'active',
          createdAt: data.createdAt?.toDate() || new Date(),
        }
      });
    }

    // 3. Migrate Super Admins
    console.log('--- Migrating Super Admins ---');
    const saSnapshot = await fb.collection('super_admins').get();
    for (const doc of saSnapshot.docs) {
      const data = doc.data();
      await prisma.superAdmin.upsert({
        where: { id: doc.id },
        update: {
          email: data.email,
          granted_at: data.granted_at?.toDate() || new Date(),
        },
        create: {
          id: doc.id,
          email: data.email,
          granted_at: data.granted_at?.toDate() || new Date(),
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

async function migrateCompanySubcollections(companyId: string) {
  // Leads
  const leadsSnapshot = await fb.collection('companies').doc(companyId).collection('leads').get();
  for (const doc of leadsSnapshot.docs) {
    const data = doc.data();
    await prisma.lead.upsert({
      where: { id: doc.id },
      update: {
        company_id: companyId,
        company_name: data.company_name,
        email: data.email,
        contact_person: data.contact_person,
        deal_value: data.deal_value,
        stage: data.stage,
        created_at: data.created_at?.toDate() || new Date(),
      },
      create: {
        id: doc.id,
        company_id: companyId,
        company_name: data.company_name,
        email: data.email,
        contact_person: data.contact_person,
        deal_value: data.deal_value,
        stage: data.stage,
        created_at: data.created_at?.toDate() || new Date(),
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
        project_name: data.project_name,
        project_ref: data.project_ref,
        client_name: data.client_name,
        status: data.status || 'in_progress',
        progress: data.progress || 0,
        budget: data.budget || 0,
        deadline: data.deadline?.toDate?.() || (data.deadline ? new Date(data.deadline) : null),
        color: data.color,
        created_at: data.created_at?.toDate() || new Date(),
      },
      create: {
        id: doc.id,
        company_id: companyId,
        project_name: data.project_name,
        project_ref: data.project_ref,
        client_name: data.client_name,
        status: data.status || 'in_progress',
        progress: data.progress || 0,
        budget: data.budget || 0,
        deadline: data.deadline?.toDate?.() || (data.deadline ? new Date(data.deadline) : null),
        color: data.color,
        created_at: data.created_at?.toDate() || new Date(),
      }
    });

    // Sub-tasks for each project
    const tasksSnapshot = await fb.collection('companies').doc(companyId).collection('projects').doc(doc.id).collection('tasks').get();
    for (const tDoc of tasksSnapshot.docs) {
        const tData = tDoc.data();
        await prisma.task.upsert({
            where: { id: tDoc.id },
            update: {
                project_id: doc.id,
                company_id: companyId,
                title: tData.title,
                status: tData.status || 'pending',
                created_at: tData.created_at?.toDate() || new Date(),
            },
            create: {
                id: tDoc.id,
                project_id: doc.id,
                company_id: companyId,
                title: tData.title,
                status: tData.status || 'pending',
                created_at: tData.created_at?.toDate() || new Date(),
            }
        });
    }
  }

  // Talents
  const talentsSnapshot = await fb.collection('companies').doc(companyId).collection('talents').get();
  for (const doc of talentsSnapshot.docs) {
    const data = doc.data();
    await prisma.talent.upsert({
      where: { id: doc.id },
      update: {
        company_id: companyId,
        full_name: data.full_name,
        category: data.category,
        location: data.location,
        followers: data.followers || 0,
        engagement_rate: data.engagement_rate || 0,
        portfolio_urls: data.portfolio_urls || [],
        created_at: data.created_at?.toDate() || new Date(),
      },
      create: {
        id: doc.id,
        company_id: companyId,
        full_name: data.full_name,
        category: data.category,
        location: data.location,
        followers: data.followers || 0,
        engagement_rate: data.engagement_rate || 0,
        portfolio_urls: data.portfolio_urls || [],
        created_at: data.created_at?.toDate() || new Date(),
      }
    });
  }

  // Proposals
  const proposalsSnapshot = await fb.collection('companies').doc(companyId).collection('proposals').get();
  for (const doc of proposalsSnapshot.docs) {
    const data = doc.data();
    await prisma.proposal.upsert({
      where: { id: doc.id },
      update: {
        company_id: companyId,
        lead_id: data.lead_id,
        title: data.title,
        content: typeof data.content === 'string' ? data.content : JSON.stringify(data.content),
        status: data.status || 'draft',
        created_at: data.created_at?.toDate() || new Date(),
      },
      create: {
        id: doc.id,
        company_id: companyId,
        lead_id: data.lead_id,
        title: data.title,
        content: typeof data.content === 'string' ? data.content : JSON.stringify(data.content),
        status: data.status || 'draft',
        created_at: data.created_at?.toDate() || new Date(),
      }
    });
  }
}

migrate();
