import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getLocalIP() {
    const interfaces = os.networkInterfaces();

    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal (loopback) addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }

    return 'localhost';
}

function updateEnvFile(ip) {

    const envPath = path.join(__dirname, '..', '.env');
    const envExamplePath = path.join(__dirname, '..', 'env.example');

    let envContent = '';

    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
    } else if (fs.existsSync(envExamplePath)) {
        envContent = fs.readFileSync(envExamplePath, 'utf8');
    } else {
        // Create default content
        envContent = `# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ehub_pms
DB_PORT=3306

# JWT Secret (Change this in production!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# API URL (for frontend)
REACT_APP_API_URL=http://localhost:3001/api
`;
    }

    // Update IP addresses
    envContent = envContent.replace(
        /FRONTEND_URL=http:\/\/[^:]+:5173/,
        `FRONTEND_URL=http://${ip}:5173`
    );
    envContent = envContent.replace(
        /REACT_APP_API_URL=http:\/\/[^:]+:3001/,
        `REACT_APP_API_URL=http://${ip}:3002`
    );

    // Add server configuration if not present
    if (!envContent.includes('PORT=')) {
        envContent += '\n# Server Configuration\nPORT=3002\nHOST=0.0.0.0\n';
    }

    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Updated .env file with IP: ${ip}`);
}

function main() {
    const localIP = getLocalIP();

    console.log('🌐 Network Configuration');
    console.log('='.repeat(40));
    console.log(`Local IP Address: ${localIP}`);
    console.log(`Frontend URL: http://${localIP}:5173`);
    console.log(`Backend API: http://${localIP}:3002`);
    console.log('='.repeat(40));

    updateEnvFile(localIP);

    console.log('\n📱 Access from other devices:');
    console.log(`   http://${localIP}:5173`);
    console.log('\n🔧 To start the application:');
    console.log('   npm run start:full');
    console.log('\n📋 Make sure to:');
    console.log('   1. Update database credentials in .env');
    console.log('   2. Run: cd backend && npm run setup');
    console.log('   3. Start the application');
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].includes('get-local-ip.js')) {
    main();
}

export { getLocalIP, updateEnvFile };
