# Ehub PMS Deployment Guide

Complete guide for deploying Ehub Project Management System in various environments, from local development to scalable production deployments.

## Table of Contents

- [Quick Start](#quick-start)
- [Docker Deployment](#docker-deployment) ⭐ Recommended
- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
- [Scaling & Performance](#scaling--performance)
- [Security Checklist](#security-checklist)
- [Monitoring & Maintenance](#monitoring--maintenance)

---

## Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone repository
git clone <repository-url>
cd EHUB_PMSV3

# Copy environment template
cp env.production.template .env

# Edit .env with your settings
nano .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Access:**
- Frontend: http://localhost:80
- Backend API: http://localhost:3002/api
- Health Check: http://localhost:3002/api/health

### Option 2: Manual Setup

See [Local Development](#local-development) section below.

---

## Docker Deployment

### Prerequisites

- Docker Engine 20.10+ or Docker Desktop
- Docker Compose 2.0+
- 4GB RAM minimum (8GB recommended for production)

### Basic Setup

1. **Configure Environment Variables**

```bash
cp env.production.template .env
```

Edit `.env` with your production values:
- Strong database password
- Secure JWT secret (use `openssl rand -base64 32`)
- Your domain URLs

2. **Start Services**

```bash
# Development mode
docker-compose up -d

# Production mode with scaling
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

3. **Initialize Database**

The database will auto-initialize on first start. You can also manually run:

```bash
docker-compose exec backend npm run setup
```

4. **Verify Deployment**

```bash
# Check all services are running
docker-compose ps

# Check logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mysql

# Test API
curl http://localhost:3002/api/health
```

### Production Deployment with Nginx

For production with SSL/HTTPS support:

```bash
# Generate SSL certificates (Let's Encrypt recommended)
# Place certificates in nginx/ssl/ directory

# Start with nginx profile
docker-compose --profile production up -d
```

### Scaling Backend Services

Scale backend to handle more load:

```bash
# Scale backend to 3 instances
docker-compose up -d --scale backend=3

# With production config
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --scale backend=3
```

Nginx will automatically load balance across all backend instances.

### Backup & Recovery

```bash
# Backup database
docker-compose exec mysql mysqldump -u root -p${DB_PASSWORD} ehub_pms > backup_$(date +%Y%m%d).sql

# Restore database
docker-compose exec -T mysql mysql -u root -p${DB_PASSWORD} ehub_pms < backup_20240101.sql
```

### Docker Commands Reference

```bash
# View logs
docker-compose logs -f [service_name]

# Restart a service
docker-compose restart [service_name]

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v

# Update and rebuild
docker-compose pull
docker-compose build --no-cache
docker-compose up -d
```

---

## Local Development

### Prerequisites

- Node.js 18+ and npm
- MySQL 8.0+ (or use Docker for MySQL only)
- 4GB RAM

### Setup Steps

1. **Clone and Install**

```bash
git clone <repository-url>
cd EHUB_PMSV3

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

2. **Configure Environment**

Create `.env` file in root directory:

```bash
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ehub_pms
DB_PORT=3306

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend URL
FRONTEND_URL=http://localhost:5173

# API URL
REACT_APP_API_URL=http://localhost:3002/api

# Server Configuration
PORT=3002
HOST=0.0.0.0
```

3. **Setup Database**

```bash
# Option 1: Use setup script
npm run setup

# Option 2: Manual SQL import
mysql -u root -p < database/ehub_pms_deployment.sql
```

4. **Start Development Servers**

```bash
# Option 1: Start both (recommended)
npm run start:full

# Option 2: Separate terminals
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
npm run dev
```

5. **Access Application**

- Frontend: http://localhost:5173
- Backend API: http://localhost:3002/api
- Health Check: http://localhost:3002/api/health

---

## Production Deployment

### Cloud Platform Deployment

#### AWS (EC2 + RDS)

1. **Launch EC2 Instance**
   - Ubuntu 22.04 LTS
   - t3.medium or larger
   - Security group: Allow ports 22, 80, 443, 3002

2. **Install Docker**

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER
sudo systemctl enable docker
```

3. **Deploy Application**

```bash
# Clone repository
git clone <repository-url>
cd EHUB_PMSV3

# Configure environment
cp env.production.template .env
nano .env  # Update with RDS endpoint and credentials

# Start services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

4. **Configure Domain & SSL**

Use AWS Application Load Balancer or Route53 with ACM certificates.

#### DigitalOcean App Platform

1. Connect GitHub repository
2. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Add environment variables
4. Deploy

#### Heroku

```bash
# Install Heroku CLI
heroku create ehub-pms

# Set environment variables
heroku config:set DB_HOST=...
heroku config:set JWT_SECRET=...

# Deploy
git push heroku main
```

### Traditional VPS Deployment

1. **Server Setup**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

2. **Deploy Application**

```bash
# Clone repository
git clone <repository-url>
cd EHUB_PMSV3

# Configure
cp env.production.template .env
nano .env

# Deploy
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

3. **Setup SSL with Let's Encrypt**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

4. **Configure Firewall**

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Process Management (Without Docker)

If deploying without Docker, use PM2:

```bash
# Install PM2
npm install -g pm2

# Start backend
cd backend
pm2 start server.js --name ehub-pms-backend

# Configure PM2 to start on boot
pm2 startup
pm2 save

# Monitor
pm2 status
pm2 logs
```

---

## Scaling & Performance

### Horizontal Scaling

#### Backend Scaling

```bash
# Scale backend to multiple instances
docker-compose up -d --scale backend=3

# Nginx automatically load balances
# Each instance handles requests in round-robin
```

#### Database Scaling

For high-traffic scenarios:

1. **Read Replicas**: Set up MySQL read replicas
2. **Connection Pooling**: Already configured (max 200 connections)
3. **Caching Layer**: Add Redis for session storage

```bash
# Enable Redis caching
docker-compose --profile caching up -d
```

### Vertical Scaling

Increase resources in `docker-compose.prod.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'      # Increase from 1
          memory: 1G     # Increase from 512M
```

### Performance Optimization

1. **Database Indexing**: Already configured on key columns
2. **Query Optimization**: Use connection pooling (configured)
3. **Static Asset Caching**: Configured in nginx
4. **Gzip Compression**: Enabled in nginx
5. **CDN**: Serve static assets via CDN (CloudFlare, AWS CloudFront)

### Monitoring

#### Health Checks

All services include health checks:

```bash
# Check service health
docker-compose ps

# Manual health check
curl http://localhost:3002/api/health
```

#### Log Management

```bash
# View logs
docker-compose logs -f

# Export logs
docker-compose logs > logs_$(date +%Y%m%d).txt

# Configure log rotation
# Add to docker-compose.yml:
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

---

## Security Checklist

### Before Production Deployment

- [ ] Change all default passwords
- [ ] Generate strong JWT secret (`openssl rand -base64 32`)
- [ ] Use strong database password (min 16 characters)
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure firewall (only open necessary ports)
- [ ] Set up rate limiting (already configured in nginx)
- [ ] Enable security headers (configured in nginx)
- [ ] Regular security updates: `docker-compose pull`
- [ ] Database backups automated
- [ ] Environment variables secured (never commit to git)
- [ ] CORS configured for your domain only
- [ ] SQL injection protection (parameterized queries used)
- [ ] XSS protection (input sanitization)

### Security Best Practices

1. **Secrets Management**
   - Use environment variables
   - Consider AWS Secrets Manager or HashiCorp Vault for production
   - Never commit `.env` files

2. **Database Security**
   - Use least privilege database user
   - Enable SSL for database connections
   - Regular backups

3. **API Security**
   - Rate limiting enabled
   - JWT token expiration (24h)
   - Password hashing (bcrypt)

---

## Monitoring & Maintenance

### Regular Maintenance Tasks

1. **Weekly**
   - Review application logs
   - Check disk space
   - Verify backups are running

2. **Monthly**
   - Update dependencies: `npm audit fix`
   - Update Docker images: `docker-compose pull`
   - Security patches: `apt update && apt upgrade`

3. **Quarterly**
   - Review and rotate secrets
   - Performance optimization review
   - Capacity planning

### Backup Strategy

```bash
# Automated daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T mysql mysqldump -u root -p${DB_PASSWORD} ehub_pms | gzip > backups/backup_${DATE}.sql.gz

# Keep last 30 days
find backups/ -name "backup_*.sql.gz" -mtime +30 -delete
```

Add to cron:
```bash
0 2 * * * /path/to/backup-script.sh
```

### Troubleshooting

#### Services Not Starting

```bash
# Check logs
docker-compose logs

# Verify environment variables
docker-compose config

# Check port conflicts
netstat -tulpn | grep :3002
```

#### Database Connection Issues

```bash
# Test database connection
docker-compose exec mysql mysql -u root -p

# Verify database exists
SHOW DATABASES;

# Check user permissions
SELECT User, Host FROM mysql.user;
```

#### High Memory Usage

```bash
# Check resource usage
docker stats

# Restart services
docker-compose restart

# Scale down if needed
docker-compose up -d --scale backend=1
```

---

## Default Login Credentials

⚠️ **IMPORTANT**: Change these immediately after deployment!

- **Admin**: `admin` / `admin123` or `admin@ehub.ph` / `admin123`
- **Supervisor**: `supervisor` / `supervisor123` or `supervisor@ehub.ph` / `supervisor123`
- **Fabricator**: `fabricator@ehub.com` / `admin123`

---

## Support & Documentation

- **Issues**: Check logs with `docker-compose logs`
- **Database Issues**: Verify connection with health check endpoint
- **Performance**: Monitor with `docker stats` or use monitoring tools

For detailed setup instructions, see:
- [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- [LOCALHOST_SETUP.md](./LOCALHOST_SETUP.md)
- [Guidelines.md](./guidelines/Guidelines.md)

---

## Quick Reference Commands

```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f

# Restart service
docker-compose restart [service]

# Scale backend
docker-compose up -d --scale backend=3

# Stop everything
docker-compose down

# Backup database
docker-compose exec mysql mysqldump -u root -p ehub_pms > backup.sql

# Update and redeploy
git pull
docker-compose build --no-cache
docker-compose up -d
```
