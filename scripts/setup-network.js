#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getLocalIP } from './get-local-ip.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function runCommand(command, description) {
    console.log(`\n🔧 ${description}...`);
    try {
        execSync(command, { stdio: 'inherit' });
        console.log(`✅ ${description} completed`);
    } catch (error) {
        console.error(`❌ ${description} failed:`, error.message);
        process.exit(1);
    }
}

function createEnvFile() {
    const envPath = path.join(__dirname, '..', '.env');

    if (fs.existsSync(envPath)) {
        console.log('📄 .env file already exists');
        return;
    }

    const localIP = getLocalIP();

    const envContent = `# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ehub_pms
DB_PORT=3306

# JWT Secret (Change this in production!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend URL (for CORS) - Auto-detected IP
FRONTEND_URL=http://${localIP}:5173

# API URL (for frontend) - Auto-detected IP
REACT_APP_API_URL=http://${localIP}:3002/api

# Server Configuration
PORT=3002
HOST=0.0.0.0
`;

    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Created .env file with IP: ${localIP}`);
}

function main() {
    console.log('🚀 Ehub PMS Network Setup');
    console.log('='.repeat(50));

    const localIP = getLocalIP();
    console.log(`🌐 Detected local IP: ${localIP}`);

    // Create .env file
    createEnvFile();

    // Install dependencies
    runCommand('npm install', 'Installing frontend dependencies');
    runCommand('cd backend && npm install', 'Installing backend dependencies');

    // Setup database
    runCommand('cd backend && npm run setup', 'Setting up database');

    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📱 Access URLs:');
    console.log(`   Frontend: http://${localIP}:5173`);
    console.log(`   Backend:  http://${localIP}:3002`);
    console.log('\n🔑 Default login credentials:');
    console.log('   Email: admin@ehub.com');
    console.log('   Password: admin123');
    console.log('\n🚀 To start the application:');
    console.log('   npm run start:full');
    console.log('\n⚠️  Remember to:');
    console.log('   1. Update database password in .env file');
    console.log('   2. Change default passwords after first login');
    console.log('   3. Configure firewall if needed');
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
