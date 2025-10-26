const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;
const HOST = process.env.HOST || '0.0.0.0';

// Security middleware
app.use(helmet());
// CORS configuration for network access
const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            // Allow local network access (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
            const isLocalNetwork = /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(origin);
            if (isLocalNetwork) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        }
    },
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ehub_pms',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Initialize database tables
async function initializeDatabase() {
    try {
        const connection = await pool.getConnection();

        // Users table
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin', 'supervisor', 'fabricator', 'client') NOT NULL,
        school VARCHAR(255),
        phone VARCHAR(20),
        gcash_number VARCHAR(20),
        secure_id VARCHAR(50) UNIQUE,
        employee_number VARCHAR(50) UNIQUE,
        client_project_id VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_secure_id (secure_id),
        INDEX idx_employee_number (employee_number)
      )
    `);

        // Projects table
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('planning', 'pending-assignment', 'in-progress', 'completed', 'cancelled') DEFAULT 'planning',
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        progress INT DEFAULT 0,
        start_date DATE,
        due_date DATE,
        budget DECIMAL(15,2),
        client_id VARCHAR(255),
        supervisor_id VARCHAR(255),
        fabricator_ids JSON,
        pending_assignments JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_client_id (client_id),
        INDEX idx_supervisor_id (supervisor_id)
      )
    `);

        // Tasks table
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(255) PRIMARY KEY,
        project_id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('pending', 'in-progress', 'completed', 'cancelled') DEFAULT 'pending',
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        assigned_to VARCHAR(255),
        created_by VARCHAR(255),
        due_date DATE,
        estimated_hours DECIMAL(5,2),
        actual_hours DECIMAL(5,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_project_id (project_id),
        INDEX idx_assigned_to (assigned_to),
        INDEX idx_status (status)
      )
    `);

        // Work logs table
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS work_logs (
        id VARCHAR(255) PRIMARY KEY,
        project_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        hours_worked DECIMAL(5,2) NOT NULL,
        description TEXT,
        progress_percentage DECIMAL(5,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_project_id (project_id),
        INDEX idx_user_id (user_id),
        INDEX idx_date (date)
      )
    `);

        // Materials table
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS materials (
        id VARCHAR(255) PRIMARY KEY,
        project_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        quantity DECIMAL(10,2) NOT NULL,
        unit VARCHAR(50),
        cost_per_unit DECIMAL(10,2),
        total_cost DECIMAL(15,2),
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_project_id (project_id)
      )
    `);

        // Create default admin users if not exists
        const [adminUsers] = await connection.execute(
            'SELECT * FROM users WHERE role = ?',
            ['admin']
        );

        if (adminUsers.length === 0) {
            // Create original admin user
            const adminPassword = await bcrypt.hash('admin123', 10);
            await connection.execute(`
        INSERT INTO users (id, name, email, password_hash, role, secure_id, employee_number, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
                'admin-1',
                'System Administrator',
                'admin@ehub.com',
                adminPassword,
                'admin',
                'ADM001',
                'EMP001',
                true
            ]);
        }

        // Always ensure the new admin user with admin@ehub.ph exists
        const [newAdminUsers] = await connection.execute(
            'SELECT * FROM users WHERE email = ?',
            ['admin@ehub.ph']
        );

        if (newAdminUsers.length === 0) {
            const newAdminPassword = await bcrypt.hash('administrator', 10);
            await connection.execute(`
        INSERT INTO users (id, name, email, password_hash, role, secure_id, employee_number, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
                'admin-2',
                'Ehub Administrator',
                'admin@ehub.ph',
                newAdminPassword,
                'admin',
                'ADM002',
                'EMP002',
                true
            ]);
        }

        // Create sample supervisor and fabricator users
        const [supervisorUsers] = await connection.execute(
            'SELECT * FROM users WHERE role = ?',
            ['supervisor']
        );

        if (supervisorUsers.length === 0) {
            const supervisorPassword = await bcrypt.hash('supervisor123', 10);
            await connection.execute(`
        INSERT INTO users (id, name, email, password_hash, role, school, phone, gcash_number, secure_id, employee_number, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
                'supervisor-1',
                'John Supervisor',
                'supervisor@ehub.ph',
                supervisorPassword,
                'supervisor',
                'Ehub University',
                '+63 987 654 3210',
                '09987654321',
                'SUP001',
                'EMP003',
                true
            ]);
        }

        const [fabricatorUsers] = await connection.execute(
            'SELECT * FROM users WHERE role = ?',
            ['fabricator']
        );

        if (fabricatorUsers.length === 0) {
            const fabricatorPassword = await bcrypt.hash('fabricator123', 10);
            await connection.execute(`
        INSERT INTO users (id, name, email, password_hash, role, school, phone, gcash_number, secure_id, employee_number, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
                'fabricator-1',
                'Jane Fabricator',
                'fabricator@ehub.ph',
                fabricatorPassword,
                'fabricator',
                'Ehub University',
                '+63 912 345 6789',
                '09123456789',
                'FAB001',
                'EMP004',
                true
            ]);
        }

        connection.release();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization error:', error);
    }
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Input validation middleware
const validateInput = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        next();
    };
};

// Sanitize input to prevent XSS
const sanitizeInput = (req, res, next) => {
    const sanitize = (obj) => {
        if (typeof obj === 'string') {
            return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        }
        if (typeof obj === 'object' && obj !== null) {
            for (let key in obj) {
                obj[key] = sanitize(obj[key]);
            }
        }
        return obj;
    };

    req.body = sanitize(req.body);
    next();
};

// Apply sanitization to all routes
app.use(sanitizeInput);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ error: 'Identifier and password are required' });
        }

        const connection = await pool.getConnection();

        // Check for admin login with hardcoded credentials
        if ((identifier === 'admin' && password === 'admin123') ||
            (identifier === 'admin@ehub.ph' && password === 'administrator')) {

            // Find the specific admin user based on identifier
            let adminUser;
            if (identifier === 'admin@ehub.ph') {
                const [users] = await connection.execute(
                    'SELECT * FROM users WHERE email = ? AND role = ? AND is_active = ?',
                    ['admin@ehub.ph', 'admin', true]
                );
                adminUser = users[0];
            } else {
                const [users] = await connection.execute(
                    'SELECT * FROM users WHERE role = ? AND is_active = ?',
                    ['admin', true]
                );
                adminUser = users[0];
            }

            if (adminUser) {
                const token = jwt.sign(
                    { id: adminUser.id, role: adminUser.role, email: adminUser.email },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );

                connection.release();
                return res.json({
                    user: { ...adminUser, password_hash: undefined },
                    token
                });
            }
        }

        // Check for regular users
        const [users] = await connection.execute(
            'SELECT * FROM users WHERE (secure_id = ? OR employee_number = ? OR email = ?) AND is_active = ?',
            [identifier, identifier, identifier, true]
        );

        if (users.length === 0) {
            connection.release();
            return res.status(404).json({ error: 'User not found' });
        }

        const user = users[0];
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            connection.release();
            return res.status(401).json({ error: 'Invalid password' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        connection.release();
        res.json({
            user: { ...user, password_hash: undefined },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password, name, school, phone, gcashNumber } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        const connection = await pool.getConnection();

        // Check if user already exists
        const [existingUsers] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            [email.toLowerCase()]
        );

        if (existingUsers.length > 0) {
            connection.release();
            return res.status(409).json({ error: 'User already exists with this email' });
        }

        // Generate secure credentials
        const secureId = `FAB${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
        const employeeNumber = `EMP${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`;
        const passwordHash = await bcrypt.hash(password, 10);

        const userId = `user-${Date.now()}`;

        await connection.execute(`
      INSERT INTO users (id, name, email, password_hash, role, school, phone, gcash_number, secure_id, employee_number, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            userId,
            name,
            email.toLowerCase(),
            passwordHash,
            'fabricator',
            school || null,
            phone || null,
            gcashNumber || null,
            secureId,
            employeeNumber,
            true
        ]);

        const [newUser] = await connection.execute(
            'SELECT * FROM users WHERE id = ?',
            [userId]
        );

        connection.release();

        const token = jwt.sign(
            { id: userId, role: 'fabricator', email: email.toLowerCase() },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            user: { ...newUser[0], password_hash: undefined },
            token
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Failed to create account' });
    }
});

// Project routes
app.get('/api/projects', authenticateToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [projects] = await connection.execute('SELECT * FROM projects ORDER BY created_at DESC');
        connection.release();
        res.json(projects);
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

app.post('/api/projects', authenticateToken, async (req, res) => {
    try {
        const projectData = req.body;
        const projectId = `project-${Date.now()}`;

        const connection = await pool.getConnection();
        await connection.execute(`
      INSERT INTO projects (id, title, description, status, priority, progress, start_date, due_date, budget, client_id, supervisor_id, fabricator_ids)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            projectId,
            projectData.name || projectData.title, // Handle both name and title
            projectData.description,
            projectData.status || 'planning',
            projectData.priority || 'medium',
            projectData.progress || 0,
            projectData.startDate || null,
            projectData.endDate || projectData.dueDate || null, // Handle both endDate and dueDate
            projectData.budget || null,
            projectData.clientId || null,
            projectData.supervisorId || null,
            JSON.stringify(projectData.fabricatorIds || [])
        ]);

        const [newProject] = await connection.execute(
            'SELECT * FROM projects WHERE id = ?',
            [projectId]
        );

        connection.release();
        res.json(newProject[0]);
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// Task routes
app.get('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [tasks] = await connection.execute('SELECT * FROM tasks ORDER BY created_at DESC');
        connection.release();
        res.json(tasks);
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const taskData = req.body;
        const taskId = `task-${Date.now()}`;

        const connection = await pool.getConnection();
        await connection.execute(`
      INSERT INTO tasks (id, project_id, title, description, status, priority, assigned_to, created_by, due_date, estimated_hours, actual_hours)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            taskId,
            taskData.projectId,
            taskData.title,
            taskData.description,
            taskData.status || 'pending',
            taskData.priority || 'medium',
            taskData.assignedTo || null,
            taskData.createdBy || null,
            taskData.dueDate || null,
            taskData.estimatedHours || 0,
            taskData.actualHours || 0
        ]);

        const [newTask] = await connection.execute(
            'SELECT * FROM tasks WHERE id = ?',
            [taskId]
        );

        connection.release();
        res.json(newTask[0]);
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// Work logs routes
app.get('/api/worklogs', authenticateToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [workLogs] = await connection.execute('SELECT * FROM work_logs ORDER BY created_at DESC');
        connection.release();
        res.json(workLogs);
    } catch (error) {
        console.error('Get work logs error:', error);
        res.status(500).json({ error: 'Failed to fetch work logs' });
    }
});

app.post('/api/worklogs', authenticateToken, async (req, res) => {
    try {
        const workLogData = req.body;
        const workLogId = `wl-${Date.now()}`;

        const connection = await pool.getConnection();
        await connection.execute(`
      INSERT INTO work_logs (id, project_id, user_id, date, hours_worked, description, progress_percentage)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
            workLogId,
            workLogData.projectId,
            workLogData.userId,
            workLogData.date,
            workLogData.hoursWorked,
            workLogData.description,
            workLogData.progressPercentage || 0
        ]);

        const [newWorkLog] = await connection.execute(
            'SELECT * FROM work_logs WHERE id = ?',
            [workLogId]
        );

        connection.release();
        res.json(newWorkLog[0]);
    } catch (error) {
        console.error('Create work log error:', error);
        res.status(500).json({ error: 'Failed to create work log' });
    }
});

// Materials routes
app.get('/api/materials', authenticateToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [materials] = await connection.execute('SELECT * FROM materials ORDER BY added_at DESC');
        connection.release();
        res.json(materials);
    } catch (error) {
        console.error('Get materials error:', error);
        res.status(500).json({ error: 'Failed to fetch materials' });
    }
});

app.post('/api/materials', authenticateToken, async (req, res) => {
    try {
        const materialData = req.body;
        const materialId = `mat-${Date.now()}`;

        const connection = await pool.getConnection();
        await connection.execute(`
      INSERT INTO materials (id, project_id, name, description, quantity, unit, cost_per_unit, total_cost)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            materialId,
            materialData.projectId,
            materialData.name,
            materialData.description,
            materialData.quantity,
            materialData.unit,
            materialData.costPerUnit,
            materialData.totalCost
        ]);

        const [newMaterial] = await connection.execute(
            'SELECT * FROM materials WHERE id = ?',
            [materialId]
        );

        connection.release();
        res.json(newMaterial[0]);
    } catch (error) {
        console.error('Create material error:', error);
        res.status(500).json({ error: 'Failed to create material' });
    }
});

// Users routes
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [users] = await connection.execute('SELECT id, name, email, role, school, phone, gcash_number, secure_id, employee_number, is_active, created_at FROM users ORDER BY created_at DESC');
        connection.release();
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Create client endpoint
app.post('/api/users/client', authenticateToken, async (req, res) => {
    try {
        const { name, email, password, phone, projectId, projectName } = req.body;

        if (!name || !email || !password || !projectId) {
            return res.status(400).json({ error: 'Name, email, password, and projectId are required' });
        }

        const connection = await pool.getConnection();

        // Check if user already exists
        const [existingUsers] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            [email.toLowerCase()]
        );

        if (existingUsers.length > 0) {
            connection.release();
            return res.status(409).json({ error: 'User already exists with this email' });
        }

        // Generate secure credentials for client
        const secureId = `CLI${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
        const passwordHash = await bcrypt.hash(password, 10);

        const userId = `user-${Date.now()}`;

        await connection.execute(`
      INSERT INTO users (id, name, email, password_hash, role, school, phone, secure_id, client_project_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            userId,
            name,
            email.toLowerCase(),
            passwordHash,
            'client',
            projectName, // Store project name in school field for clients
            phone || null,
            secureId,
            projectId,
            true
        ]);

        const [newUser] = await connection.execute(
            'SELECT * FROM users WHERE id = ?',
            [userId]
        );

        connection.release();

        res.json({ user: { ...newUser[0], password_hash: undefined } });
    } catch (error) {
        console.error('Create client error:', error);
        res.status(500).json({ error: 'Failed to create client account' });
    }
});

// Initialize database and start server
initializeDatabase().then(() => {
    app.listen(PORT, HOST, () => {
        console.log(`🚀 Server running on ${HOST}:${PORT}`);
        console.log(`🌐 Network access: http://${HOST}:${PORT}`);
        console.log(`🏥 Health check: http://${HOST}:${PORT}/api/health`);
        console.log(`📱 Access from other devices: http://[YOUR_LOCAL_IP]:${PORT}`);
    });
}).catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});

module.exports = app;
