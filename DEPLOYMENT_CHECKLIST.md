# Deployment Checklist

Use this checklist when deploying Ehub Project Management to production.

## Pre-Deployment

### 1. Code Quality
- [ ] Run `npm run lint` - No errors
- [ ] Run `npm run build` - Builds successfully
- [ ] Test all major features locally
- [ ] Check browser console for errors
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test responsive design on mobile devices

### 2. Environment Configuration
- [ ] Create `.env.local` file (DO NOT commit this)
- [ ] Set `VITE_SUPABASE_URL` with your project URL
- [ ] Set `VITE_SUPABASE_ANON_KEY` with your anon key
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)
- [ ] Set `SUPABASE_DB_URL` with your database URL
- [ ] Verify all environment variables are correct

### 3. Supabase Setup
- [ ] Create Supabase project
- [ ] Note your Project URL and API keys
- [ ] Install Supabase CLI: `npm install -g supabase`
- [ ] Login: `supabase login`
- [ ] Link project: `supabase link --project-ref your-project-id`
- [ ] Deploy edge functions: `supabase functions deploy`
- [ ] Test edge functions are working
- [ ] Configure storage buckets (if using file uploads)
- [ ] Set up Row Level Security (RLS) policies

### 4. Security Review
- [ ] `.env.local` is in `.gitignore`
- [ ] No hardcoded credentials in code
- [ ] Service role key is only used server-side
- [ ] All API routes are properly authenticated
- [ ] CORS is configured correctly
- [ ] Rate limiting is enabled (if applicable)

## Deployment Options

### Option A: Vercel (Recommended)

1. **Prepare Repository**
   - [ ] Push code to GitHub/GitLab/Bitbucket
   - [ ] Ensure `.gitignore` includes `.env.local`

2. **Deploy to Vercel**
   - [ ] Go to [vercel.com](https://vercel.com) and login
   - [ ] Click "New Project"
   - [ ] Import your Git repository
   - [ ] Configure build settings (Vite should be auto-detected)
   - [ ] Add environment variables in Vercel dashboard
   - [ ] Deploy!

3. **Post-Deployment**
   - [ ] Test the live URL
   - [ ] Verify database connections work
   - [ ] Check that environment variables are loaded
   - [ ] Test login functionality
   - [ ] Create first admin user

### Option B: Netlify

1. **Build Locally**
   - [ ] Run `npm run build`
   - [ ] Verify `dist/` folder is created

2. **Deploy to Netlify**
   - [ ] Go to [netlify.com](https://netlify.com) and login
   - [ ] Click "Add new site"
   - [ ] Choose "Deploy manually" or connect Git
   - [ ] Upload `dist` folder (if manual)
   - [ ] Add environment variables in Netlify dashboard
   - [ ] Configure build settings: `npm run build`
   - [ ] Set publish directory: `dist`

3. **Post-Deployment**
   - [ ] Test the live URL
   - [ ] Verify all features work
   - [ ] Set up continuous deployment (optional)

### Option C: VPS/Server

1. **Prepare Server**
   - [ ] Install Node.js 18+ on server
   - [ ] Install nginx or apache
   - [ ] Set up SSL certificate (Let's Encrypt)
   - [ ] Configure firewall

2. **Build and Upload**
   - [ ] Run `npm run build` locally
   - [ ] Upload `dist/` folder to server
   - [ ] Configure web server to serve static files
   - [ ] Set up environment variables on server

3. **Web Server Configuration**
   - [ ] Configure nginx/apache for SPA routing
   - [ ] Enable gzip compression
   - [ ] Set up caching headers
   - [ ] Configure HTTPS redirect

## Post-Deployment Verification

### Functionality Tests
- [ ] Login works correctly
- [ ] User registration works
- [ ] Project creation works
- [ ] Task management works
- [ ] File uploads work (if enabled)
- [ ] Email notifications work (if configured)
- [ ] All user roles function correctly
- [ ] Database persistence works

### Performance Tests
- [ ] Page load time < 3 seconds
- [ ] Images are optimized
- [ ] No console errors
- [ ] Mobile performance is acceptable
- [ ] All API calls complete successfully

### Security Tests
- [ ] No exposed API keys in browser
- [ ] HTTPS is enforced
- [ ] Authentication is required for protected routes
- [ ] Session management works correctly
- [ ] Password reset flow works

## Production Configuration

### Recommended Settings

**Vercel/Netlify:**
```bash
Build Command: npm run build
Output Directory: dist
Node Version: 18.x or higher
```

**Environment Variables Required:**
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx (server-side only)
SUPABASE_DB_URL=xxxxx (server-side only)
```

## Troubleshooting

### Build Fails
- Check Node.js version (must be 18+)
- Clear cache: `npm cache clean --force`
- Delete `node_modules` and reinstall
- Check for TypeScript errors: `npm run lint`

### Environment Variables Not Working
- Ensure they're prefixed with `VITE_` for client-side
- Restart dev server after adding env vars
- Check spelling and formatting
- Verify values don't have extra quotes or spaces

### Database Connection Issues
- Verify Supabase URL and keys are correct
- Check Supabase project is active
- Ensure edge functions are deployed
- Check browser console for specific errors

### 404 Errors on Refresh
- Configure hosting for SPA routing
- Add redirect rules for all routes to index.html
- Check Vercel/Netlify configuration

## Maintenance

### Regular Tasks
- [ ] Monitor error logs
- [ ] Update dependencies monthly: `npm update`
- [ ] Review and rotate API keys quarterly
- [ ] Backup database regularly
- [ ] Monitor server resources
- [ ] Review and update security settings

### Updates
- [ ] Test updates in staging first
- [ ] Keep dependencies up to date
- [ ] Monitor Supabase changelog
- [ ] Review and apply security patches

## Rollback Plan

If deployment fails:
1. Revert to previous Git commit
2. Redeploy previous working version
3. Check error logs for issues
4. Fix issues in development
5. Test thoroughly before redeploying

---

**Need Help?** Contact your development team or refer to:
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [Supabase Documentation](https://supabase.com/docs)
