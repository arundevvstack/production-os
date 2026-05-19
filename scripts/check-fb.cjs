const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const SERVICE_ACCOUNT_PATH = path.join(process.cwd(), 'firebase-service-account.json');
const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const fb = admin.firestore();

async function check() {
  const collections = await fb.listCollections();
  console.log('Collections:', collections.map(c => c.id));
}

check();
