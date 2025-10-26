const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setupDatabase() {
  let connection;

  try {
    console.log('Setting up Ehub PMS Database...');

    // Create database first
    const dbName = process.env.DB_NAME || 'ehub_pms';
    const tempConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    });

    console.log('Connected to MySQL server');

    // Create database
    await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`Database '${dbName}' created or already exists`);
    await tempConnection.end();

    // Connect to the specific database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306,
      database: dbName
    });

    // Create tables
    console.log('Creating tables...');

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
    console.log('✓ Users table created');

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
    console.log('✓ Projects table created');

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
    console.log('✓ Tasks table created');

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
    console.log('✓ Work logs table created');

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
    console.log('✓ Materials table created');

    // Create default admin user
    const [adminUsers] = await connection.execute(
      'SELECT * FROM users WHERE role = ?',
      ['admin']
    );

    if (adminUsers.length === 0) {
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
      console.log('✓ Default admin user created (admin@ehub.com / admin123)');
    } else {
      console.log('✓ Admin user already exists');
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Copy env.example to .env and configure your database settings');
    console.log('2. Run: npm install');
    console.log('3. Run: npm start (or npm run dev for development)');
    console.log('\nDefault admin credentials:');
    console.log('Email: admin@ehub.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();
