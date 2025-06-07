# Installation Guide - Clinical Trial Table Metadata System

## Table of Contents
- [Overview](#overview)
- [System Requirements](#system-requirements)
- [Quick Installation](#quick-installation)
- [Detailed Installation](#detailed-installation)
- [Configuration](#configuration)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [Upgrade Instructions](#upgrade-instructions)

## Overview

The Clinical Trial Table Metadata System can be installed in several ways depending on your needs:

- **Docker Compose** (Recommended for most users)
- **Kubernetes** (For production environments)
- **Development Setup** (For contributors and developers)
- **Cloud Deployment** (Using cloud providers)

## System Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4 GB
- **Storage**: 20 GB free space
- **OS**: Linux, macOS, or Windows 10/11
- **Network**: Internet connection for initial setup

### Recommended for Production
- **CPU**: 4+ cores
- **RAM**: 8+ GB
- **Storage**: 100+ GB SSD
- **OS**: Linux (Ubuntu 20.04+, CentOS 8+, RHEL 8+)
- **Network**: High-speed internet connection

### Software Dependencies
- **Docker**: 20.10 or later
- **Docker Compose**: 2.0 or later
- **Git**: For source code management
- **Web Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## Quick Installation

### Option 1: One-Command Setup (Recommended)

```bash
# Download and run the installation script
curl -fsSL https://raw.githubusercontent.com/your-org/clinical-trial-metadata-system/main/install.sh | bash
```

This script will:
- Check system requirements
- Install Docker and Docker Compose if needed
- Download the application
- Set up the environment
- Start all services

### Option 2: Manual Quick Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/clinical-trial-metadata-system.git
cd clinical-trial-metadata-system

# 2. Run the infrastructure setup
chmod +x setup-infrastructure.sh
./setup-infrastructure.sh all

# 3. Configure environment
cp .env.example .env
# Edit .env with your settings

# 4. Start the application
./deploy.sh dev start
```

### Accessing the Application

After installation, the application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Database Admin**: http://localhost:8080

## Detailed Installation

### Step 1: Prerequisites Installation

#### Install Docker (Linux)
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and back in for group changes to take effect
```

#### Install Docker (macOS)
```bash
# Using Homebrew
brew install --cask docker

# Or download Docker Desktop from https://docker.com
```

#### Install Docker (Windows)
1. Download Docker Desktop from https://docker.com
2. Run the installer
3. Restart your computer
4. Enable WSL 2 if prompted

#### Verify Docker Installation
```bash
docker --version
docker-compose --version
docker run hello-world
```

### Step 2: Download the Application

#### Option A: Git Clone (Recommended)
```bash
git clone https://github.com/your-org/clinical-trial-metadata-system.git
cd clinical-trial-metadata-system
```

#### Option B: Download ZIP
1. Go to the GitHub repository
2. Click "Code" → "Download ZIP"
3. Extract to your preferred directory
4. Navigate to the extracted folder

### Step 3: Environment Setup

#### Create Environment File
```bash
cp .env.example .env
```

#### Edit Environment Variables
Open `.env` in your preferred text editor and configure:

```bash
# Database Configuration
POSTGRES_DB=ars_db
POSTGRES_USER=ars_user
POSTGRES_PASSWORD=your_secure_password_here

# Backend Configuration
SECRET_KEY=your_very_secure_secret_key_32_chars_min
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Redis Configuration (optional)
REDIS_PASSWORD=your_redis_password_here

# Domain Configuration (for production)
DOMAIN=localhost
ACME_EMAIL=admin@yourdomain.com

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

**Important Security Notes:**
- Change all default passwords
- Use a strong SECRET_KEY (minimum 32 characters)
- For production, use a real domain name

### Step 4: Choose Installation Method

#### Method A: Development Installation

For development, testing, or single-user setups:

```bash
./deploy.sh dev start
```

This will:
- Start PostgreSQL database
- Start Redis cache
- Start backend API with hot reload
- Start frontend with development server
- Start Adminer for database management

#### Method B: Production Installation

For production environments:

```bash
# First, ensure your .env file has production values
./deploy.sh prod deploy
```

This will:
- Build production Docker images
- Start all services with production configuration
- Set up SSL/TLS with Let's Encrypt
- Configure reverse proxy with Traefik

### Step 5: Database Initialization

The database will be automatically initialized on first startup. To manually initialize:

```bash
# For development
docker-compose -f docker-compose.dev.yml exec backend alembic upgrade head

# For production
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

### Step 6: Create Initial User

```bash
# Create superuser account
docker-compose exec backend python -c "
from app.db.init_db import init_db
from app.core.config import settings
init_db()
"
```

Or create via the web interface by registering the first user.

## Configuration

### Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_DB` | `ars_db` | Database name |
| `POSTGRES_USER` | `ars_user` | Database username |
| `POSTGRES_PASSWORD` | Required | Database password |
| `SECRET_KEY` | Required | JWT secret key |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Token expiration time |
| `CORS_ORIGINS` | `*` | Allowed CORS origins |
| `LOG_LEVEL` | `info` | Logging level |
| `ENVIRONMENT` | `development` | Environment type |

### Database Configuration

#### Using External PostgreSQL
```bash
# In .env file
DATABASE_URL=postgresql://user:password@host:port/database
```

#### Using External Redis
```bash
# In .env file
REDIS_URL=redis://password@host:port/database
```

### SSL/TLS Configuration

#### Development (Self-signed)
```bash
# Generate self-signed certificates
mkdir -p ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem -out ssl/cert.pem
```

#### Production (Let's Encrypt)
```bash
# Configure in .env
DOMAIN=yourdomain.com
ACME_EMAIL=admin@yourdomain.com

# Traefik will automatically obtain certificates
```

### Email Configuration (Optional)
```bash
# SMTP settings in .env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_TLS=true
```

### Backup Configuration
```bash
# Backup settings in .env
BACKUP_ENCRYPTION_KEY=your_backup_encryption_key
BACKUP_SCHEDULE=0 2 * * *  # Daily at 2 AM
AWS_BACKUP_BUCKET=your-backup-bucket  # For S3 backups
```

## Verification

### Health Checks

Check if all services are running:

```bash
# Check service status
./deploy.sh dev status

# Or manually check
docker-compose ps
```

### Application Tests

```bash
# Test backend API
curl http://localhost:8000/api/v1/health

# Test frontend
curl http://localhost:3000

# Test database connection
./deploy.sh dev logs postgres
```

### Functional Verification

1. **Open the application** in your browser at http://localhost:3000
2. **Register a new account** or log in
3. **Create a test analysis** using the Analysis Builder
4. **Export the analysis** to verify the complete workflow

### Performance Verification

```bash
# Check resource usage
docker stats

# Monitor logs for errors
./deploy.sh dev logs
```

## Troubleshooting

### Common Issues

#### Port Conflicts
**Problem**: "Port already in use" error

**Solution**:
```bash
# Check what's using the port
sudo lsof -i :3000
sudo lsof -i :8000

# Stop conflicting services or change ports in docker-compose files
```

#### Database Connection Issues
**Problem**: Backend can't connect to database

**Solutions**:
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Verify connection settings in .env file
```

#### Memory Issues
**Problem**: System running out of memory

**Solutions**:
```bash
# Check memory usage
free -h
docker stats

# Increase swap space or reduce container limits
```

#### Permission Issues (Linux)
**Problem**: Permission denied errors

**Solutions**:
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Set proper file permissions
chmod +x deploy.sh
chmod +x setup-infrastructure.sh

# Log out and back in
```

### Log Analysis

View detailed logs for troubleshooting:

```bash
# All services
./deploy.sh dev logs

# Specific service
./deploy.sh dev logs backend
./deploy.sh dev logs frontend
./deploy.sh dev logs postgres

# Follow logs in real-time
docker-compose logs -f backend
```

### Reset Installation

To completely reset the installation:

```bash
# Stop all services
./deploy.sh dev stop

# Remove all containers and volumes
./deploy.sh dev cleanup

# Start fresh
./deploy.sh dev start
```

## Upgrade Instructions

### Backup Before Upgrade

```bash
# Create database backup
./deploy.sh prod backup

# Export current configuration
docker-compose config > docker-compose-backup.yml
```

### Upgrade Process

```bash
# 1. Pull latest code
git pull origin main

# 2. Stop services
./deploy.sh prod stop

# 3. Update Docker images
docker-compose pull

# 4. Start services
./deploy.sh prod deploy

# 5. Run database migrations
docker-compose exec backend alembic upgrade head
```

### Rollback Process

If upgrade fails:

```bash
# 1. Stop services
./deploy.sh prod stop

# 2. Checkout previous version
git checkout previous-version-tag

# 3. Restore database backup
./deploy.sh prod restore backup-file.sql

# 4. Start services
./deploy.sh prod start
```

## Advanced Installation Options

### Kubernetes Installation

For production Kubernetes deployment:

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n ars-system
```

### Cloud Provider Specific

#### AWS EKS
```bash
# Create EKS cluster
eksctl create cluster --name ars-cluster --region us-west-2

# Deploy application
kubectl apply -f k8s/
```

#### Azure AKS
```bash
# Create AKS cluster
az aks create --resource-group ars-rg --name ars-cluster

# Deploy application
kubectl apply -f k8s/
```

#### Google GKE
```bash
# Create GKE cluster
gcloud container clusters create ars-cluster

# Deploy application
kubectl apply -f k8s/
```

### Development Environment

For contributing to the project:

```bash
# Install development dependencies
cd backend && pip install -r requirements-dev.txt
cd frontend && npm install

# Set up pre-commit hooks
pre-commit install

# Run tests
cd backend && pytest
cd frontend && npm test
```

## Security Considerations

### Production Security Checklist

- [ ] Change all default passwords
- [ ] Use strong SECRET_KEY (32+ characters)
- [ ] Enable HTTPS with valid certificates
- [ ] Configure proper CORS origins
- [ ] Set up firewall rules
- [ ] Enable audit logging
- [ ] Regular security updates
- [ ] Backup encryption
- [ ] Access control and user management

### Network Security

```bash
# Configure firewall (example for Ubuntu)
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### Database Security

```bash
# Use strong database passwords
# Enable SSL connections
# Regular backups with encryption
# Network isolation
```

This installation guide provides comprehensive instructions for setting up the Clinical Trial Table Metadata System in various environments. For additional help, consult the troubleshooting section or contact support.