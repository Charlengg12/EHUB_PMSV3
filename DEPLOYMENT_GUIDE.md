# Ehub PMS Deployment Guide

## 🚀 Local Network Setup

### 1. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ehub_pms
DB_PORT=3306

# JWT Secret (Change this in production!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend URL (Update with your local IP address)
FRONTEND_URL=http://192.168.1.100:5173

# API URL (Update with your local IP address)
REACT_APP_API_URL=http://192.168.1.100:3002/api

# Server Configuration
PORT=3002
HOST=0.0.0.0
```

### 2. Find Your Local IP Address

**Windows:**
```cmd
ipconfig
```

**Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Update the IP addresses in your `.env` file with your actual local IP.

### 3. Install Dependencies and Setup Database

```bash
# Install backend dependencies
cd backend
npm install

# Setup database
npm run setup

# Install frontend dependencies
cd ..
npm install
```

### 4. Start the Application

**Option 1: Start both frontend and backend**
```bash
npm run start:full
```

**Option 2: Start separately**
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
npm run dev
```

### 5. Access from Other Devices

Once running, other devices on your network can access:
- **Frontend:** `http://YOUR_LOCAL_IP:5173`
- **Backend API:** `http://YOUR_LOCAL_IP:3002`

## 🌐 Production Deployment

### 1. Database Setup (phpMyAdmin)

1. **Access your hosting control panel**
2. **Open phpMyAdmin**
3. **Create a new database:**
   - Database name: `ehub_pms`
   - Collation: `utf8mb4_unicode_ci`

4. **Import the database structure:**
   - Go to the `ehub_pms` database
   - Click "Import" tab
   - Upload the file: `database/ehub_pms_deployment.sql`
   - Click "Go" to execute

### 2. Environment Configuration

Create a `.env` file on your server:

```bash
# Database Configuration (Use your hosting database details)
DB_HOST=localhost
DB_USER=your_hosting_db_user
DB_PASSWORD=your_hosting_db_password
DB_NAME=ehub_pms
DB_PORT=3306

# JWT Secret (Generate a strong secret)
JWT_SECRET=your-very-strong-jwt-secret-for-production

# Frontend URL (Your domain)
FRONTEND_URL=https://yourdomain.com

# API URL (Your domain)
REACT_APP_API_URL=https://yourdomain.com/api

# Server Configuration
PORT=3002
HOST=0.0.0.0
```

### 3. File Upload

Upload your project files to your hosting server:

```
/public_html/
├── backend/
│   ├── server.js
│   ├── setup.js
│   ├── package.json
│   └── node_modules/ (after npm install)
├── components/
├── styles/
├── public/
├── index.html
├── main.tsx
├── App.tsx
└── package.json
```

### 4. Build and Deploy

```bash
# Build the frontend for production
npm run build

# Install backend dependencies on server
cd backend
npm install --production

# Start the backend server
npm start
```

### 5. Server Configuration

**For cPanel/Shared Hosting:**
- Upload files via File Manager
- Set up Node.js application in cPanel
- Configure environment variables

**For VPS/Dedicated Server:**
- Use PM2 for process management:
```bash
npm install -g pm2
pm2 start backend/server.js --name "ehub-pms"
pm2 startup
pm2 save
```

## 🔧 Default Login Credentials

After deployment, you can log in with:

- **Admin:** admin@ehub.com / admin123
- **Supervisor:** supervisor@ehub.com / admin123
- **Fabricator:** fabricator@ehub.com / admin123
- **Client:** client@ehub.com / admin123

**⚠️ Important:** Change these passwords immediately after first login!

## 📱 Network Access Troubleshooting

### Common Issues:

1. **CORS Errors:**
   - Ensure your local IP is correctly set in `.env`
   - Check firewall settings

2. **Database Connection:**
   - Verify MySQL is running
   - Check database credentials
   - Ensure database exists

3. **Port Access:**
   - Check if ports 3002 and 5173 are open
   - Verify firewall settings

### Testing Network Access:

```bash
# Test backend API
curl http://YOUR_LOCAL_IP:3002/api/health

# Test from another device
# Open browser and go to: http://YOUR_LOCAL_IP:5173
```

## 🛡️ Security Considerations

1. **Change default passwords**
2. **Use strong JWT secrets**
3. **Enable HTTPS in production**
4. **Configure proper CORS origins**
5. **Set up proper database user permissions**
6. **Regular security updates**

## 📞 Support

If you encounter issues:
1. Check the console logs
2. Verify all environment variables
3. Test database connectivity
4. Check network connectivity
5. Review firewall settings

