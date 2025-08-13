const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'app.db');
const db = new sqlite3.Database(dbPath);

const tenantId = '02a58dcc-70e1-4e98-ad8f-b5fd1d15fa3b';

// Generate UUIDs
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function seedData() {
  console.log('Starting CRM data seeding...');
  
  // Clear existing data
  await new Promise((resolve, reject) => {
    db.run(`DELETE FROM crm_activities WHERE tenantId = ?`, [tenantId], (err) => {
      if (err) reject(err); else resolve();
    });
  });
  
  await new Promise((resolve, reject) => {
    db.run(`DELETE FROM crm_deals WHERE tenantId = ?`, [tenantId], (err) => {
      if (err) reject(err); else resolve();
    });
  });
  
  await new Promise((resolve, reject) => {
    db.run(`DELETE FROM crm_contacts WHERE tenantId = ?`, [tenantId], (err) => {
      if (err) reject(err); else resolve();
    });
  });
  
  await new Promise((resolve, reject) => {
    db.run(`DELETE FROM crm_accounts WHERE tenantId = ?`, [tenantId], (err) => {
      if (err) reject(err); else resolve();
    });
  });

  // Create accounts
  const accounts = [];
  for (let i = 1; i <= 10; i++) {
    const id = generateUUID();
    accounts.push(id);
    
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO crm_accounts (id, tenantId, name, website, industry, provider, connectorId, externalId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [
        id,
        tenantId,
        `Company ${i}`,
        `https://company${i}.com`,
        ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing'][i % 5],
        'salesforce',
        'seed-connector',
        `ext-acc-${i}`
      ], (err) => {
        if (err) reject(err); else resolve();
      });
    });
  }
  console.log(`Created ${accounts.length} accounts`);

  // Create contacts
  const contacts = [];
  for (let i = 1; i <= 20; i++) {
    const id = generateUUID();
    contacts.push(id);
    
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO crm_contacts (id, tenantId, firstName, lastName, email, phone, provider, connectorId, externalId, accountId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [
        id,
        tenantId,
        ['John', 'Jane', 'Mike', 'Sarah', 'David'][i % 5],
        ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'][i % 5],
        `contact${i}@company${Math.ceil(i/2)}.com`,
        `555-010${i.toString().padStart(2, '0')}`,
        'salesforce',
        'seed-connector',
        `ext-con-${i}`,
        accounts[Math.floor(i/2) % accounts.length]
      ], (err) => {
        if (err) reject(err); else resolve();
      });
    });
  }
  console.log(`Created ${contacts.length} contacts`);

  // Create deals
  const deals = [];
  const stages = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
  const now = new Date();
  
  for (let i = 1; i <= 30; i++) {
    const id = generateUUID();
    deals.push(id);
    const stage = stages[Math.floor(Math.random() * stages.length)];
    const closeDate = new Date(now);
    closeDate.setDate(closeDate.getDate() + Math.floor(Math.random() * 90) - 30);
    
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO crm_deals (id, tenantId, name, amount, stage, closeDate, provider, connectorId, externalId, accountId, contactId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [
        id,
        tenantId,
        `Deal ${i} - Company ${(i % 10) + 1}`,
        Math.floor(Math.random() * 500000) + 10000,
        stage,
        closeDate.toISOString().split('T')[0],
        'salesforce',
        'seed-connector',
        `ext-deal-${i}`,
        accounts[i % accounts.length],
        contacts[i % contacts.length]
      ], (err) => {
        if (err) reject(err); else resolve();
      });
    });
  }
  console.log(`Created ${deals.length} deals`);

  // Create activities
  const activityTypes = ['call', 'email', 'meeting', 'demo', 'follow-up'];
  
  for (let i = 1; i <= 50; i++) {
    const id = generateUUID();
    const occurredAt = new Date(now);
    occurredAt.setDate(occurredAt.getDate() - Math.floor(Math.random() * 30));
    
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO crm_activities (id, tenantId, type, subject, occurredAt, notes, provider, connectorId, externalId, dealId, contactId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [
        id,
        tenantId,
        activityTypes[i % activityTypes.length],
        `${activityTypes[i % activityTypes.length]} with Contact`,
        occurredAt.toISOString(),
        `Discussion about Deal ${(i % 30) + 1}`,
        'salesforce',
        'seed-connector',
        `ext-act-${i}`,
        deals[i % deals.length],
        contacts[i % contacts.length]
      ], (err) => {
        if (err) reject(err); else resolve();
      });
    });
  }
  console.log('Created 50 activities');
  
  console.log('CRM data seeding completed successfully!');
  db.close();
}

seedData().catch(console.error);