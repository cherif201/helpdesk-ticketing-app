#!/usr/bin/env node

/**
 * Backend Setup Script
 * This script installs dependencies, runs Prisma migration, and generates Prisma client
 */

const { execSync } = require('child_process');
const path = require('path');

const backendDir = __dirname;

console.log('🚀 Starting backend setup...\n');

// Step 1: Install dependencies
console.log('📦 Installing dependencies...');
try {
  execSync('npm install', { cwd: backendDir, stdio: 'inherit' });
  console.log('✅ Dependencies installed\n');
} catch (error) {
  console.error('❌ Failed to install dependencies');
  process.exit(1);
}

// Step 2: Install new dependencies
console.log('📦 Installing new dependencies (prom-client, uuid)...');
try {
  execSync('npm install prom-client uuid', { cwd: backendDir, stdio: 'inherit' });
  execSync('npm install -D @types/uuid', { cwd: backendDir, stdio: 'inherit' });
  console.log('✅ New dependencies installed\n');
} catch (error) {
  console.error('❌ Failed to install new dependencies');
  process.exit(1);
}

// Step 3: Run Prisma migration
console.log('🗄️  Running Prisma migration...');
try {
  execSync('npx prisma migrate dev --name add_rbac_comments_audit', { cwd: backendDir, stdio: 'inherit' });
  console.log('✅ Migration completed\n');
} catch (error) {
  console.error('❌ Migration failed');
  process.exit(1);
}

// Step 4: Generate Prisma Client
console.log('⚙️  Generating Prisma Client...');
try {
  execSync('npx prisma generate', { cwd: backendDir, stdio: 'inherit' });
  console.log('✅ Prisma Client generated\n');
} catch (error) {
  console.error('❌ Failed to generate Prisma Client');
  process.exit(1);
}

console.log('✨ Backend setup complete!');
console.log('\n📝 Next steps:');
console.log('  1. Start the backend: npm run start:dev');
console.log('  2. Visit Swagger docs: http://localhost:3000/api/docs');
console.log('  3. Promote a user to AGENT role via Prisma Studio or direct DB update');
console.log('  4. Test the new features!');
