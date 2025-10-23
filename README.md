# Ehub Project Management System

A comprehensive project management system designed for fabricators, supervisors, and administrators. Built with React, TypeScript, Tailwind CSS, and Supabase.

## 🚀 Quick Start

**For localhost development**: See [LOCALHOST_SETUP.md](./LOCALHOST_SETUP.md) for a simple guide to get started in minutes.

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## Features

### Multi-Role Authentication
- **Administrators**: Full system access, user management, and oversight
- **Supervisors**: Project management, team coordination, and assignment control  
- **Fabricators**: Task management, work logs, and project participation
- **Clients**: Project status viewing and documentation access

### Core Functionality
- **Project Management**: Create, track, and manage construction/fabrication projects
- **Task Management**: Assign, update, and monitor task progress
- **Work Logs**: Detailed progress reports and time tracking
- **Materials Management**: Track materials usage and costs
- **User Management**: Role-based access control and team administration
- **Revenue Tracking**: Financial overview with role-based visibility
- **Archives System**: Completed project history filtered by organization
- **File Upload**: Support for project documentation and images
- **Email Notifications**: Automated alerts for assignments and updates

### Security Features
- **Secure ID Generation**: Unique FAB/SUP/ADM IDs for user identification
- **Password Hashing**: Secure password storage
- **Role-based Access**: Granular permissions system
- **Forgot Password**: Email-based password recovery
- **Database Integration**: Full Supabase backend with real-time sync

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Edge Functions, Auth, Storage)
- **UI Components**: Radix UI primitives with custom styling
- **Build Tool**: Vite
- **Deployment**: Can be deployed to Vercel, Netlify, or any static hosting

## Quick Start (Localhost)

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager
- Supabase account (optional - free tier available at [supabase.com](https://supabase.com))

### Installation Steps

1. **Clone or download the repository**
   ```bash
   git clone <repository-url>
   cd ehub-project-management
   ```

2. **Install all dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables (Optional)**
   
   The app can run in demo mode without Supabase. For full functionality:
   
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SUPABASE_DB_URL=your-database-url
   ```

4. **Deploy Supabase Edge Functions (Optional)**
   
   Only needed if using Supabase backend:
   ```bash
   # Install Supabase CLI globally
   npm install -g supabase
   
   # Login to your Supabase account
   supabase login
   
   # Link to your Supabase project
   supabase link --project-ref your-project-id
   
   # Deploy the server functions
   supabase functions deploy
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```
   
   The application will start at: **http://localhost:3000**

6. **Access the application**
   - Open your browser to http://localhost:3000
   - Create an administrator account to get started
   - The app works in demo mode if Supabase is not configured

### Running Without Supabase (Demo Mode)

The application can run locally without a Supabase backend connection. In this mode:
- Data is stored in memory (lost on refresh)
- All features are available for testing
- Perfect for development and testing
- No external dependencies required

## Usage

### Initial Setup
1. Login with your administrator credentials
2. The system will automatically initialize the database
3. Create supervisor and fabricator accounts as needed

### User Registration
- **Fabricators**: Can self-register through the signup form
- **Supervisors/Admins**: Must be created by existing administrators
- All users receive unique secure IDs (FAB001, SUP001, ADM001, etc.)

### Login Methods
- **All Users**: Can login with email, employee number, or secure ID
- **Multi-Factor Support**: System supports various identifier types

### Forgot Password
- Click "Forgot Password" on login screen
- Enter email address to receive reset instructions
- System sends credentials reminder and reset options

## Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
1. Push code to GitHub/GitLab
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Deploy to Netlify
1. Build the project: `npm run build`
2. Upload `dist` folder to Netlify
3. Configure environment variables
4. Set up continuous deployment

### Deploy to VPS/Server
1. Build the project: `npm run build`
2. Serve `dist` folder with nginx/apache
3. Configure environment variables
4. Set up SSL certificate

## Project Structure

```
├── components/           # React components
│   ├── auth/            # Authentication forms
│   ├── dashboard/       # Dashboard widgets
│   ├── projects/        # Project management
│   ├── tasks/           # Task management
│   ├── users/           # User management
│   ├── ui/              # Reusable UI components
│   └── ...
├── supabase/            # Supabase configuration
│   └── functions/       # Edge functions
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
├── styles/              # Global styles
└── data/                # Data management
```

## API Endpoints

The system uses Supabase Edge Functions for backend operations:

- `POST /auth/login` - User authentication
- `POST /auth/signup` - User registration  
- `POST /forgot-password` - Password reset
- `GET/POST /projects` - Project management
- `GET/POST /tasks` - Task management
- `GET/POST /worklogs` - Work log entries
- `GET/POST /materials` - Materials tracking
- `GET /users` - User management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation in the `/docs` folder

## Security

- Never commit `.env.local` or other environment files
- Keep Supabase service role keys secure
- Use HTTPS in production
- Regularly update dependencies
- Follow security best practices for user data

## Changelog

### Version 1.0.0
- Initial release with full project management features
- Multi-role authentication system
- Database integration with Supabase
- Responsive design for mobile and desktop
- Email notification system
- File upload and documentation management