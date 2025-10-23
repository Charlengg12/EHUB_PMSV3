# Localhost Setup Guide

## Quick Start for Local Development

Follow these simple steps to run Ehub Project Management on your local machine.

### 1. Prerequisites

Make sure you have the following installed:
- **Node.js 18 or higher** - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**

### 2. Installation

Open your terminal/command prompt and run:

```bash
# Navigate to the project directory
cd ehub-project-management

# Install all dependencies
npm install
```

### 3. Run the Application

Start the development server:

```bash
npm run dev
```

The application will start and you can access it at: **http://localhost:3000**

### 4. First Login

When you first open the application:
1. You'll see the login screen
2. Create your administrator account or login with existing credentials
3. The app will work in demo mode if Supabase is not configured

### Optional: Supabase Configuration

For full backend functionality with database persistence:

1. **Create a `.env.local` file** by copying the example:
   ```bash
   cp .env.example .env.local
   ```

2. **Get your Supabase credentials**:
   - Create a free account at [supabase.com](https://supabase.com)
   - Create a new project
   - Go to Settings > API
   - Copy your Project URL and API keys

3. **Update `.env.local`** with your credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   SUPABASE_DB_URL=your-database-url-here
   ```

4. **Deploy Edge Functions** (if using Supabase):
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Login to Supabase
   supabase login
   
   # Link your project (replace with your project ID)
   supabase link --project-ref your-project-id
   
   # Deploy functions
   supabase functions deploy
   ```

5. **Restart the development server**:
   ```bash
   npm run dev
   ```

## Common Commands

- `npm run dev` - Start development server (localhost:3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run code linting

## Troubleshooting

### Port 3000 is already in use
If port 3000 is busy, the application will automatically try the next available port (3001, 3002, etc.)

### Dependencies installation fails
Try deleting `node_modules` folder and `package-lock.json`, then run `npm install` again:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Application won't start
1. Make sure you're using Node.js 18 or higher: `node --version`
2. Clear npm cache: `npm cache clean --force`
3. Reinstall dependencies: `npm install`

## Demo Mode vs. Full Mode

### Demo Mode (No Supabase)
- ✅ All features work
- ✅ Perfect for testing and development
- ❌ Data resets on page refresh
- ❌ No persistence between sessions

### Full Mode (With Supabase)
- ✅ All features work
- ✅ Data persists in database
- ✅ Real-time updates
- ✅ File storage
- ✅ Email notifications (requires SMTP setup)

## Next Steps

After getting the app running:
1. Explore the dashboard
2. Create projects and tasks
3. Set up user roles (admin, supervisor, fabricator, client)
4. Test the workflow
5. Configure Supabase for production use

For more information, see the [README.md](./README.md) file.
