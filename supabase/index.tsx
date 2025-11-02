// @ts-nocheck
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Utility function to generate secure IDs
function generateSecureId(role: 'admin' | 'supervisor' | 'fabricator'): string {
  const prefix = role === 'admin' ? 'ADM' : role === 'supervisor' ? 'SUP' : 'FAB';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 3).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

// Generate employee number
function generateEmployeeNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 999).toString().padStart(3, '0');
  return `EMP${timestamp}${random}`;
}

// Password hashing utility (simple for demo - use bcrypt in production)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Send email function
async function sendEmail(to: string, subject: string, htmlBody: string): Promise<void> {
  // In production, implement actual email sending
  console.log(`Email would be sent to ${to}: ${subject}`);
  console.log(`Body: ${htmlBody}`);
}

// Health check endpoint
app.get("/make-server-ebae10ad/health", (c) => {
  return c.json({ status: "ok" });
});

// User authentication endpoints
app.post("/make-server-ebae10ad/auth/login", async (c) => {
  try {
    const { identifier, password } = await c.req.json();

    // Check for admin login
    if (identifier === 'admin' && password === 'admin123') {
      const adminUsers = await kv.get('admin_users') || [];
      let adminUser = adminUsers.find((u: any) => u.role === 'admin');

      if (!adminUser) {
        // Create default admin user
        adminUser = {
          id: 'admin-1',
          name: 'System Administrator',
          email: 'admin@ehub.com',
          role: 'admin',
          school: 'Ehub University',
          phone: '+63 123 456 7890',
          gcashNumber: '09123456789',
          secureId: 'ADM001',
          employeeNumber: 'EMP001',
          isActive: true,
          createdAt: new Date().toISOString()
        };
        adminUsers.push(adminUser);
        await kv.set('admin_users', adminUsers);
      }

      return c.json({ user: adminUser });
    }

    // Check for regular users by identifier
    const users = await kv.get('users') || [];
    const user = users.find((u: any) =>
      u.secureId?.toLowerCase() === identifier.toLowerCase() ||
      u.employeeNumber?.toLowerCase() === identifier.toLowerCase() ||
      u.email?.toLowerCase() === identifier.toLowerCase()
    );

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    if (!user.isActive) {
      return c.json({ error: 'Account is inactive' }, 403);
    }

    // Verify password (simplified for demo)
    const hashedInputPassword = await hashPassword(password);
    if (user.passwordHash && user.passwordHash !== hashedInputPassword) {
      return c.json({ error: 'Invalid password' }, 401);
    }

    return c.json({ user });
  } catch (error) {
    console.log('Login exception:', error);
    return c.json({ error: 'Invalid request' }, 400);
  }
});

app.post("/make-server-ebae10ad/auth/signup", async (c) => {
  try {
    const { email, password, name, school, phone, gcashNumber } = await c.req.json();

    // Check if user already exists
    const users = await kv.get('users') || [];
    const existingUser = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      return c.json({ error: 'User already exists with this email' }, 409);
    }

    // Generate secure credentials
    const secureId = generateSecureId('fabricator');
    const employeeNumber = generateEmployeeNumber();
    const passwordHash = await hashPassword(password);

    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email: email.toLowerCase(),
      role: 'fabricator',
      school,
      phone,
      gcashNumber,
      secureId,
      employeeNumber,
      passwordHash,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await kv.set('users', users);

    // Send welcome email
    const welcomeEmail = `
      <h2>Welcome to Ehub Project Management!</h2>
      <p>Dear ${name},</p>
      <p>Your fabricator account has been successfully created. Here are your login credentials:</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <strong>Login ID:</strong> ${secureId}<br>
        <strong>Employee Number:</strong> ${employeeNumber}<br>
        <strong>Email:</strong> ${email}
      </div>
      <p>Please keep these credentials secure and use your Login ID to access the system.</p>
      <p>Best regards,<br>Ehub Project Management Team</p>
    `;

    await sendEmail(email, 'Welcome to Ehub Project Management', welcomeEmail);

    return c.json({ user: { ...newUser, passwordHash: undefined } });
  } catch (error) {
    console.log('Signup exception:', error);
    return c.json({ error: 'Failed to create account' }, 500);
  }
});

app.post("/make-server-ebae10ad/forgot-password", async (c) => {
  try {
    const { email } = await c.req.json();

    const users = await kv.get('users') || [];
    const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Don't reveal if user exists or not for security
      return c.json({ message: 'If an account exists with this email, a reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomUUID();
    const resetExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save reset token
    const resetTokens = await kv.get('password_reset_tokens') || [];
    resetTokens.push({
      email: email.toLowerCase(),
      token: resetToken,
      expiresAt: resetExpiry.toISOString(),
      used: false
    });
    await kv.set('password_reset_tokens', resetTokens);

    // Send reset email
    const resetEmail = `
      <h2>Password Reset Request</h2>
      <p>Dear ${user.name},</p>
      <p>You have requested to reset your password for your Ehub Project Management account.</p>
      <p>Your login credentials reminder:</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <strong>Login ID:</strong> ${user.secureId}<br>
        <strong>Employee Number:</strong> ${user.employeeNumber}<br>
        <strong>Email:</strong> ${user.email}
      </div>
      <p>If you need to reset your password, please contact your system administrator.</p>
      <p>This request will expire in 15 minutes.</p>
      <p>If you did not request this reset, please ignore this email.</p>
      <p>Best regards,<br>Ehub Project Management Team</p>
    `;

    await sendEmail(email, 'Password Reset Request - Ehub Project Management', resetEmail);

    return c.json({ message: 'If an account exists with this email, a reset link has been sent.' });
  } catch (error) {
    console.log('Forgot password exception:', error);
    return c.json({ error: 'Failed to process password reset request' }, 500);
  }
});

// Project management endpoints
app.get("/make-server-ebae10ad/projects", async (c) => {
  try {
    const projects = await kv.get('projects') || [];
    return c.json(projects);
  } catch (error) {
    console.log('Get projects error:', error);
    return c.json({ error: 'Failed to fetch projects' }, 500);
  }
});

app.post("/make-server-ebae10ad/projects", async (c) => {
  try {
    const projectData = await c.req.json();
    const projects = await kv.get('projects') || [];

    const newProject = {
      ...projectData,
      id: `project-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    projects.push(newProject);
    await kv.set('projects', projects);

    return c.json(newProject);
  } catch (error) {
    console.log('Create project error:', error);
    return c.json({ error: 'Failed to create project' }, 500);
  }
});

app.put("/make-server-ebae10ad/projects/:id", async (c) => {
  try {
    const projectId = c.req.param('id');
    const updates = await c.req.json();
    const projects = await kv.get('projects') || [];

    const index = projects.findIndex((p: any) => p.id === projectId);
    if (index === -1) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const updatedProject = {
      ...projects[index],
      ...updates,
      // ensure id remains consistent
      id: projects[index].id,
    };

    projects[index] = updatedProject;
    await kv.set('projects', projects);

    return c.json(updatedProject);
  } catch (error) {
    console.log('Update project error:', error);
    return c.json({ error: 'Failed to update project' }, 500);
  }
});

// Task management endpoints
app.get("/make-server-ebae10ad/tasks", async (c) => {
  try {
    const tasks = await kv.get('tasks') || [];
    return c.json(tasks);
  } catch (error) {
    console.log('Get tasks error:', error);
    return c.json({ error: 'Failed to fetch tasks' }, 500);
  }
});

app.post("/make-server-ebae10ad/tasks", async (c) => {
  try {
    const taskData = await c.req.json();
    const tasks = await kv.get('tasks') || [];

    const newTask = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    tasks.push(newTask);
    await kv.set('tasks', tasks);

    return c.json(newTask);
  } catch (error) {
    console.log('Create task error:', error);
    return c.json({ error: 'Failed to create task' }, 500);
  }
});

app.put("/make-server-ebae10ad/tasks/:id", async (c) => {
  try {
    const taskId = c.req.param('id');
    const updates = await c.req.json();
    const tasks = await kv.get('tasks') || [];

    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) {
      return c.json({ error: 'Task not found' }, 404);
    }

    tasks[taskIndex] = {
      ...tasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await kv.set('tasks', tasks);

    return c.json(tasks[taskIndex]);
  } catch (error) {
    console.log('Update task error:', error);
    return c.json({ error: 'Failed to update task' }, 500);
  }
});

app.delete("/make-server-ebae10ad/tasks/:id", async (c) => {
  try {
    const taskId = c.req.param('id');
    const tasks = await kv.get('tasks') || [];

    const filteredTasks = tasks.filter(task => task.id !== taskId);
    await kv.set('tasks', filteredTasks);

    return c.json({ success: true });
  } catch (error) {
    console.log('Delete task error:', error);
    return c.json({ error: 'Failed to delete task' }, 500);
  }
});

// Work logs endpoints
app.get("/make-server-ebae10ad/worklogs", async (c) => {
  try {
    const workLogs = await kv.get('workLogs') || [];
    return c.json(workLogs);
  } catch (error) {
    console.log('Get work logs error:', error);
    return c.json({ error: 'Failed to fetch work logs' }, 500);
  }
});

app.post("/make-server-ebae10ad/worklogs", async (c) => {
  try {
    const workLogData = await c.req.json();
    const workLogs = await kv.get('workLogs') || [];

    const newWorkLog = {
      ...workLogData,
      id: `wl-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    workLogs.push(newWorkLog);
    await kv.set('workLogs', workLogs);

    return c.json(newWorkLog);
  } catch (error) {
    console.log('Create work log error:', error);
    return c.json({ error: 'Failed to create work log' }, 500);
  }
});

// Materials endpoints
app.get("/make-server-ebae10ad/materials", async (c) => {
  try {
    const materials = await kv.get('materials') || [];
    return c.json(materials);
  } catch (error) {
    console.log('Get materials error:', error);
    return c.json({ error: 'Failed to fetch materials' }, 500);
  }
});

app.post("/make-server-ebae10ad/materials", async (c) => {
  try {
    const materialData = await c.req.json();
    const materials = await kv.get('materials') || [];

    const newMaterial = {
      ...materialData,
      id: `mat-${Date.now()}`,
      addedAt: new Date().toISOString(),
    };

    materials.push(newMaterial);
    await kv.set('materials', materials);

    return c.json(newMaterial);
  } catch (error) {
    console.log('Create material error:', error);
    return c.json({ error: 'Failed to create material' }, 500);
  }
});

// Users endpoints
app.get("/make-server-ebae10ad/users", async (c) => {
  try {
    const users = await kv.get('users') || [];
    return c.json(users);
  } catch (error) {
    console.log('Get users error:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

// Create supervisor endpoint
app.post("/make-server-ebae10ad/users/supervisor", async (c) => {
  try {
    const { email, password, name, phone, department } = await c.req.json();

    // Check if user already exists
    const users = await kv.get('users') || [];
    const existingUser = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      return c.json({ error: 'User already exists with this email' }, 409);
    }

    // Generate secure credentials
    const secureId = generateSecureId('supervisor');
    const employeeNumber = generateEmployeeNumber();
    const passwordHash = await hashPassword(password);

    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email: email.toLowerCase(),
      role: 'supervisor',
      school: department,
      phone,
      secureId,
      employeeNumber,
      passwordHash,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await kv.set('users', users);

    // Send welcome email
    const welcomeEmail = `
      <h2>Welcome to Ehub Project Management!</h2>
      <p>Dear ${name},</p>
      <p>Your supervisor account has been successfully created. Here are your login credentials:</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <strong>Secure ID:</strong> ${secureId}<br>
        <strong>Employee Number:</strong> ${employeeNumber}<br>
        <strong>Email:</strong> ${email}
      </div>
      <p>Please keep these credentials secure and use your Secure ID or Email to login.</p>
      <p>Best regards,<br>Ehub Project Management Team</p>
    `;

    await sendEmail(email, 'Welcome to Ehub Project Management - Supervisor Account', welcomeEmail);

    return c.json({ user: { ...newUser, passwordHash: undefined } });
  } catch (error) {
    console.log('Create supervisor exception:', error);
    return c.json({ error: 'Failed to create supervisor account' }, 500);
  }
});

// Create client endpoint
app.post("/make-server-ebae10ad/users/client", async (c) => {
  try {
    const { email, password, name, phone, projectId, projectName } = await c.req.json();

    // Check if user already exists
    const users = await kv.get('users') || [];
    const existingUser = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      return c.json({ error: 'User already exists with this email' }, 409);
    }

    // Generate secure credentials for client
    const secureId = generateSecureId('admin'); // Using admin format for clients: CLI prefix
    const passwordHash = await hashPassword(password);

    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email: email.toLowerCase(),
      role: 'client',
      school: projectName, // Store project name in school field for clients
      phone,
      secureId,
      clientProjectId: projectId,
      passwordHash,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await kv.set('users', users);

    // Send welcome email
    const welcomeEmail = `
      <h2>Welcome to Ehub Project Management!</h2>
      <p>Dear ${name},</p>
      <p>A client account has been created for you to track your project: <strong>${projectName}</strong></p>
      <p>Here are your login credentials:</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <strong>Login ID:</strong> ${secureId}<br>
        <strong>Email:</strong> ${email}<br>
        <strong>Password:</strong> (as provided during setup)
      </div>
      <p>You can use your Login ID or Email to access the system and view:</p>
      <ul>
        <li>Project progress and status updates</li>
        <li>Documentation and attachments</li>
        <li>Work logs and progress reports</li>
      </ul>
      <p>Please keep these credentials secure.</p>
      <p>Best regards,<br>Ehub Project Management Team</p>
    `;

    await sendEmail(email, `Welcome to Ehub - ${projectName} Client Portal`, welcomeEmail);

    return c.json({ user: { ...newUser, passwordHash: undefined } });
  } catch (error) {
    console.log('Create client exception:', error);
    return c.json({ error: 'Failed to create client account' }, 500);
  }
});

// Initialize default data
app.post("/make-server-ebae10ad/init", async (c) => {
  try {
    // Initialize with mock data if not exists
    const existingProjects = await kv.get('projects');
    if (!existingProjects) {
      // Initialize with your mock data here
      await kv.set('projects', []);
      await kv.set('tasks', []);
      await kv.set('workLogs', []);
      await kv.set('materials', []);
      await kv.set('users', []);
    }

    return c.json({ message: 'Database initialized' });
  } catch (error) {
    console.log('Init error:', error);
    return c.json({ error: 'Failed to initialize database' }, 500);
  }
});

// Danger: Clear all application data (users, admins, projects, tasks, logs, materials)
app.post("/make-server-ebae10ad/reset", async (c) => {
  try {
    await kv.set('projects', []);
    await kv.set('tasks', []);
    await kv.set('workLogs', []);
    await kv.set('materials', []);
    await kv.set('users', []);
    await kv.set('admin_users', []);
    await kv.set('password_reset_tokens', []);
    return c.json({ message: 'All data cleared' });
  } catch (error) {
    console.log('Reset error:', error);
    return c.json({ error: 'Failed to clear data' }, 500);
  }
});

Deno.serve(app.fetch);