# Deployment Guide for Clinical Trial Table Metadata System

This guide provides comprehensive instructions for deploying the Clinical Trial Table Metadata System in various environments.

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Cloud Deployment](#cloud-deployment)
- [Monitoring and Observability](#monitoring-and-observability)
- [Security Considerations](#security-considerations)
- [Backup and Disaster Recovery](#backup-and-disaster-recovery)
- [Troubleshooting](#troubleshooting)

## Overview

The system can be deployed in multiple ways:
- **Docker Compose**: For local development and testing
- **Kubernetes**: For production-grade deployments
- **Cloud Platforms**: AWS, Azure, GCP with managed services

### Architecture Components
- **Frontend**: React application served by Nginx
- **Backend**: FastAPI application with Python
- **Database**: PostgreSQL for data persistence
- **Cache**: Redis for session management and caching
- **Reverse Proxy**: Traefik or Nginx for load balancing

## Prerequisites

### Required Software
- Docker (20.10+) and Docker Compose (2.0+)
- kubectl (for Kubernetes deployments)
- Git for source code management

### Optional Tools
- Helm (for Kubernetes package management)
- Terraform (for infrastructure as code)
- ArgoCD (for GitOps deployments)

### System Requirements

#### Minimum (Development)
- CPU: 2 cores
- RAM: 4 GB
- Storage: 20 GB
- Network: 1 Gbps

#### Recommended (Production)
- CPU: 8 cores
- RAM: 16 GB
- Storage: 100 GB SSD
- Network: 10 Gbps

## Environment Configuration

### 1. Clone Repository
```bash
git clone https://github.com/your-org/clinical-trial-metadata-system.git
cd clinical-trial-metadata-system
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
```

Edit `.env` with your specific values:
```bash
# Database
POSTGRES_DB=ars_db
POSTGRES_USER=ars_user
POSTGRES_PASSWORD=your_secure_password

# Backend
SECRET_KEY=your_very_secure_secret_key_here
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Domain and SSL
DOMAIN=yourdomain.com
ACME_EMAIL=admin@yourdomain.com
```

## Docker Deployment

### Development Environment

1. **Start Development Environment**
```bash
./deploy.sh dev start
```

2. **Access Services**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Database Admin: http://localhost:8080
- API Documentation: http://localhost:8000/docs

3. **Stop Services**
```bash
./deploy.sh dev stop
```

### Production Environment

1. **Deploy to Production**
```bash
./deploy.sh prod deploy
```

2. **Access Services**
- Frontend: https://yourdomain.com
- Backend API: https://api.yourdomain.com
- Traefik Dashboard: https://traefik.yourdomain.com:8080

3. **Monitor Services**
```bash
./deploy.sh prod status
./deploy.sh prod logs
```

### Backup and Restore

1. **Create Backup**
```bash
./deploy.sh prod backup
```

2. **Restore from Backup**
```bash
./deploy.sh prod restore /path/to/backup.sql
```

## Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (1.25+)
- kubectl configured
- NGINX Ingress Controller
- cert-manager (for SSL certificates)

### 1. Apply Kubernetes Manifests

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Apply configuration
kubectl apply -f k8s/configmap.yaml

# Deploy database and cache
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml

# Deploy applications
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml

# Configure ingress
kubectl apply -f k8s/ingress.yaml

# Set up monitoring
kubectl apply -f k8s/monitoring.yaml
```

### 2. Verify Deployment

```bash
# Check pod status
kubectl get pods -n ars-system

# Check services
kubectl get svc -n ars-system

# Check ingress
kubectl get ingress -n ars-system

# View logs
kubectl logs -f deployment/backend -n ars-system
```

### 3. Scale Applications

```bash
# Scale backend
kubectl scale deployment backend --replicas=5 -n ars-system

# Scale frontend
kubectl scale deployment frontend --replicas=3 -n ars-system
```

### 4. Update Applications

```bash
# Update backend image
kubectl set image deployment/backend backend=ghcr.io/your-org/ars-backend:v1.2.0 -n ars-system

# Update frontend image
kubectl set image deployment/frontend frontend=ghcr.io/your-org/ars-frontend:v1.2.0 -n ars-system
```

## Cloud Deployment

### AWS Deployment

#### Using EKS (Elastic Kubernetes Service)

1. **Create EKS Cluster**
```bash
eksctl create cluster --name ars-cluster --region us-west-2 --nodes 3
```

2. **Install Add-ons**
```bash
# AWS Load Balancer Controller
helm repo add eks https://aws.github.io/eks-charts
helm install aws-load-balancer-controller eks/aws-load-balancer-controller -n kube-system

# External DNS
helm repo add external-dns https://kubernetes-sigs.github.io/external-dns/
helm install external-dns external-dns/external-dns
```

3. **Deploy Application**
```bash
kubectl apply -f k8s/
```

#### Using Fargate

1. **Create Fargate Profile**
```bash
eksctl create fargateprofile --cluster ars-cluster --name ars-profile --namespace ars-system
```

2. **Deploy with Fargate-specific configurations**
```bash
kubectl apply -f k8s/fargate/
```

### Azure Deployment

#### Using AKS (Azure Kubernetes Service)

1. **Create AKS Cluster**
```bash
az aks create --resource-group ars-rg --name ars-cluster --node-count 3 --enable-addons monitoring
```

2. **Get Credentials**
```bash
az aks get-credentials --resource-group ars-rg --name ars-cluster
```

3. **Deploy Application**
```bash
kubectl apply -f k8s/
```

### GCP Deployment

#### Using GKE (Google Kubernetes Engine)

1. **Create GKE Cluster**
```bash
gcloud container clusters create ars-cluster --num-nodes=3 --zone=us-central1-a
```

2. **Get Credentials**
```bash
gcloud container clusters get-credentials ars-cluster --zone=us-central1-a
```

3. **Deploy Application**
```bash
kubectl apply -f k8s/
```

## Monitoring and Observability

### Prometheus and Grafana

1. **Install Prometheus Stack**
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace
```

2. **Access Grafana**
```bash
kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring
```
Default credentials: admin/prom-operator

3. **Import Dashboard**
- Use the dashboard configuration from `k8s/monitoring.yaml`
- Dashboard ID: Configure custom dashboard for ARS metrics

### Application Logging

1. **ELK Stack (Elasticsearch, Logstash, Kibana)**
```bash
helm repo add elastic https://helm.elastic.co
helm install elasticsearch elastic/elasticsearch -n logging --create-namespace
helm install kibana elastic/kibana -n logging
```

2. **Fluentd for Log Collection**
```bash
helm install fluentd stable/fluentd -n logging
```

### Application Performance Monitoring

1. **Jaeger for Distributed Tracing**
```bash
helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
helm install jaeger jaegertracing/jaeger -n tracing --create-namespace
```

2. **Sentry for Error Tracking**
```bash
# Configure SENTRY_DSN in environment variables
export SENTRY_DSN=your_sentry_dsn_here
```

## Security Considerations

### Network Security

1. **Network Policies**
```bash
kubectl apply -f k8s/security/network-policies.yaml
```

2. **Pod Security Standards**
```bash
kubectl label namespace ars-system pod-security.kubernetes.io/enforce=restricted
```

### Secrets Management

1. **Using Kubernetes Secrets**
```bash
kubectl create secret generic ars-secrets \
  --from-literal=postgres-password=your_password \
  --from-literal=secret-key=your_secret_key \
  -n ars-system
```

2. **Using External Secrets Operator**
```bash
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets -n external-secrets --create-namespace
```

3. **Using HashiCorp Vault**
```bash
helm repo add hashicorp https://helm.releases.hashicorp.com
helm install vault hashicorp/vault -n vault --create-namespace
```

### Image Security

1. **Scan Images with Trivy**
```bash
trivy image ghcr.io/your-org/ars-backend:latest
trivy image ghcr.io/your-org/ars-frontend:latest
```

2. **Use Distroless Images**
- Backend images use minimal Python base images
- Frontend images use nginx:alpine

### RBAC Configuration

```bash
kubectl apply -f k8s/security/rbac.yaml
```

## Backup and Disaster Recovery

### Database Backup

1. **Automated Backups with CronJob**
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: postgres-backup
            image: postgres:15
            command:
            - /bin/bash
            - -c
            - pg_dump -h postgres-service -U $POSTGRES_USER $POSTGRES_DB > /backup/backup-$(date +%Y%m%d_%H%M%S).sql
```

2. **S3 Backup Storage**
```bash
# Install AWS CLI in backup container
# Upload backups to S3
aws s3 cp /backup/ s3://your-backup-bucket/ --recursive
```

### Application Backup

1. **Configuration Backup**
```bash
kubectl get all,configmap,secret -n ars-system -o yaml > ars-backup.yaml
```

2. **Persistent Volume Snapshots**
```bash
# Create volume snapshots (cloud-specific)
kubectl apply -f k8s/backup/volume-snapshots.yaml
```

### Disaster Recovery Plan

1. **RTO (Recovery Time Objective)**: 4 hours
2. **RPO (Recovery Point Objective)**: 1 hour
3. **Backup Retention**: 30 days
4. **Cross-region replication**: Enabled for critical data

## Troubleshooting

### Common Issues

#### Pods Not Starting

1. **Check Pod Status**
```bash
kubectl describe pod <pod-name> -n ars-system
```

2. **Check Resource Limits**
```bash
kubectl top pods -n ars-system
kubectl top nodes
```

3. **Check Logs**
```bash
kubectl logs <pod-name> -n ars-system --previous
```

#### Database Connection Issues

1. **Verify Database Service**
```bash
kubectl get endpoints postgres-service -n ars-system
```

2. **Test Database Connection**
```bash
kubectl run -it --rm debug --image=postgres:15 --restart=Never -- psql -h postgres-service -U ars_user -d ars_db
```

#### SSL Certificate Issues

1. **Check cert-manager**
```bash
kubectl get certificates -n ars-system
kubectl describe certificate ars-tls-secret -n ars-system
```

2. **Check Let's Encrypt Rate Limits**
```bash
kubectl logs -n cert-manager deployment/cert-manager
```

### Performance Issues

1. **Monitor Resource Usage**
```bash
kubectl top pods -n ars-system
kubectl top nodes
```

2. **Check HPA Status**
```bash
kubectl get hpa -n ars-system
kubectl describe hpa backend-hpa -n ars-system
```

3. **Database Performance**
```bash
# Connect to database and run:
SELECT * FROM pg_stat_activity;
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

### Getting Help

1. **Check Application Logs**
```bash
./deploy.sh prod logs backend
kubectl logs -f deployment/backend -n ars-system
```

2. **Monitor System Health**
```bash
./deploy.sh prod status
kubectl get pods,svc,ingress -n ars-system
```

3. **Review Metrics**
- Access Grafana dashboards
- Check Prometheus alerts
- Review application performance metrics

## Maintenance

### Regular Tasks

1. **Update Dependencies** (Monthly)
```bash
# Update base images
docker pull postgres:15
docker pull redis:7-alpine
docker pull nginx:alpine

# Rebuild application images
./deploy.sh prod deploy
```

2. **Certificate Renewal** (Automatic with cert-manager)
```bash
kubectl get certificates -n ars-system
```

3. **Database Maintenance** (Weekly)
```bash
# Vacuum and analyze database
kubectl exec -it deployment/postgres -n ars-system -- psql -U ars_user -d ars_db -c "VACUUM ANALYZE;"
```

4. **Security Updates** (As needed)
```bash
# Scan for vulnerabilities
trivy image ghcr.io/your-org/ars-backend:latest
trivy image ghcr.io/your-org/ars-frontend:latest
```

### Scaling Guidelines

1. **Horizontal Scaling**
- Backend: Scale based on CPU/memory usage
- Frontend: Scale based on request volume
- Database: Use read replicas for read-heavy workloads

2. **Vertical Scaling**
- Increase resource limits for individual components
- Monitor resource utilization and adjust accordingly

This deployment guide provides a comprehensive approach to deploying and maintaining the Clinical Trial Table Metadata System across different environments and platforms.