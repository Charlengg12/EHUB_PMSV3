# Production Deployment Checklist

Use this checklist to ensure a successful and secure production deployment.

## Pre-Deployment

### Code & Build
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Build succeeds without errors (`npm run build`)
- [ ] No console errors or warnings in production build
- [ ] TypeScript compilation successful
- [ ] ESLint passes with no errors

### Environment Configuration
- [ ] `.env` file created from `env.production.template`
- [ ] All environment variables set and verified
- [ ] Database credentials configured
- [ ] JWT secret generated (use `openssl rand -base64 32`)
- [ ] Strong database password set (min 16 characters)
- [ ] Frontend URL configured
- [ ] API URL configured
- [ ] Email service configured (if using)

### Security
- [ ] All default passwords changed
- [ ] JWT secret is strong and unique
- [ ] Database password is strong
- [ ] No sensitive data in code
- [ ] `.env` file not committed to git
- [ ] SSL certificates obtained (Let's Encrypt or commercial)
- [ ] CORS origins configured correctly
- [ ] Rate limiting enabled
- [ ] Security headers configured

### Database
- [ ] Database server accessible
- [ ] Database created (`ehub_pms`)
- [ ] Database user created with appropriate permissions
- [ ] Initial schema imported (`database/ehub_pms_deployment.sql`)
- [ ] Database indexes created
- [ ] Connection pooling configured
- [ ] Backup strategy implemented

## Deployment

### Docker Deployment
- [ ] Docker and Docker Compose installed
- [ ] Docker images built successfully
- [ ] Containers start without errors
- [ ] All services healthy (check with `docker-compose ps`)
- [ ] Health check endpoint responding (`/api/health`)
- [ ] Frontend accessible
- [ ] Backend API accessible
- [ ] Database connection working

### Network & Firewall
- [ ] Firewall configured (ports 22, 80, 443 only)
- [ ] Domain DNS configured
- [ ] SSL certificate installed and valid
- [ ] HTTPS redirect working
- [ ] Port 3002 not publicly exposed (only via reverse proxy)

### Nginx Configuration (If using)
- [ ] Nginx configuration validated (`nginx -t`)
- [ ] Reverse proxy configured
- [ ] SSL certificates installed
- [ ] Security headers enabled
- [ ] Rate limiting configured
- [ ] Static asset caching configured
- [ ] Gzip compression enabled

### Testing
- [ ] Frontend loads correctly
- [ ] Login functionality works
- [ ] All user roles can log in
- [ ] API endpoints responding
- [ ] Database queries working
- [ ] File uploads working (if applicable)
- [ ] Email sending works (if configured)
- [ ] No CORS errors
- [ ] No console errors

## Post-Deployment

### Monitoring
- [ ] Logging configured
- [ ] Error tracking set up (Sentry, etc.)
- [ ] Monitoring dashboard configured
- [ ] Alerts configured for critical issues
- [ ] Health checks monitoring active

### Backup
- [ ] Database backup automated
- [ ] Backup tested (restore procedure verified)
- [ ] Backup retention policy set
- [ ] Off-site backup configured

### Documentation
- [ ] Deployment documentation updated
- [ ] Environment variables documented
- [ ] Access credentials documented (securely)
- [ ] Runbook created for common issues

### Performance
- [ ] Load testing completed
- [ ] Response times acceptable (< 200ms API, < 2s page load)
- [ ] Database query performance acceptable
- [ ] Resource usage within limits
- [ ] CDN configured (if applicable)

### Security Audit
- [ ] Security headers verified
- [ ] HTTPS enforced
- [ ] No exposed endpoints without authentication
- [ ] Rate limiting working
- [ ] SQL injection protection verified
- [ ] XSS protection verified
- [ ] Password requirements enforced

## Production Readiness

### High Availability
- [ ] Multiple backend instances (if needed)
- [ ] Load balancing configured
- [ ] Database replication (if needed)
- [ ] Failover mechanisms in place
- [ ] Graceful degradation handled

### Scaling Prepared
- [ ] Horizontal scaling tested
- [ ] Database scaling plan ready
- [ ] Caching strategy implemented (if needed)
- [ ] Auto-scaling rules defined (if applicable)

### Maintenance
- [ ] Update procedure documented
- [ ] Rollback procedure documented
- [ ] Maintenance window scheduled
- [ ] Team trained on deployment process

## User Acceptance

### Functionality
- [ ] All core features working
- [ ] User roles and permissions correct
- [ ] Data integrity verified
- [ ] Performance acceptable
- [ ] Mobile responsiveness verified

### User Testing
- [ ] Admin can log in and manage users
- [ ] Supervisor can log in and manage projects
- [ ] Fabricator can log in and submit work logs
- [ ] Client can view assigned projects
- [ ] All workflows end-to-end tested

## Sign-Off

### Team Approval
- [ ] Development team approved
- [ ] QA team approved
- [ ] Security team approved (if applicable)
- [ ] Operations team approved
- [ ] Stakeholders notified

### Go-Live
- [ ] Backup taken before go-live
- [ ] Team on standby for launch
- [ ] Monitoring active
- [ ] Communication plan ready
- [ ] Rollback plan ready

---

## Quick Deployment Command Reference

```bash
# Full deployment
./deploy.sh update

# Start services
./deploy.sh start

# Check status
./deploy.sh status

# View logs
./deploy.sh logs

# Backup database
./deploy.sh backup

# Scale backend
docker-compose up -d --scale backend=3
```

---

## Emergency Contacts

- **DevOps**: [Contact Info]
- **Database Admin**: [Contact Info]
- **Security Team**: [Contact Info]
- **On-Call Engineer**: [Contact Info]

---

**Last Updated**: [Date]
**Deployed By**: [Name]
**Deployment Date**: [Date]
