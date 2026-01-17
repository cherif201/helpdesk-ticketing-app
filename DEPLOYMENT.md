# OpenShift Deployment Guide

Complete step-by-step guide for deploying the Helpdesk Ticketing System on OpenShift.

## Prerequisites

- OpenShift cluster access (4.x or later)
- `oc` CLI installed and configured
- Docker or Podman installed locally
- Access to build and push images to OpenShift registry

## Architecture Overview

The application consists of 5 containers deployed as microservices:

1. **postgres** - PostgreSQL database with PVC for persistence
2. **mailhog** - SMTP testing service with web UI
3. **api** - NestJS backend (2+ replicas for HA)
4. **mailer** - Email worker service (1 replica)
5. **frontend** - React SPA served by nginx (2+ replicas for HA)

## Deployment Steps

### Step 1: Login to OpenShift

```bash
# Login to your OpenShift cluster
oc login <your-openshift-api-url>

# Or with token
oc login --token=<your-token> --server=<your-openshift-api-url>

# Verify login
oc whoami
```

### Step 2: Create Project/Namespace

```bash
# Create the helpdesk namespace
oc apply -f openshift/01-namespace.yaml

# Switch to the namespace
oc project helpdesk

# Verify
oc status
```

### Step 3: Create ImageStreams

ImageStreams allow OpenShift to track and manage container images:

```bash
oc apply -f openshift/00-imagestreams.yaml

# Verify ImageStreams created
oc get imagestreams
```

### Step 4: Create Secrets

Secrets store sensitive configuration:

```bash
oc apply -f openshift/02-secrets.yaml

# Verify secrets created
oc get secrets | grep -E 'postgres-secret|app-secret'
```

**Important**: Before production use, update the secrets with secure values:

```bash
# Update database password
oc patch secret postgres-secret -n helpdesk -p '{"stringData":{"POSTGRES_PASSWORD":"<strong-password>"}}'

# Update JWT secret
oc patch secret app-secret -n helpdesk -p '{"stringData":{"JWT_SECRET":"<random-secret-key>"}}'

# Update database URL with new password
oc patch secret app-secret -n helpdesk -p '{"stringData":{"DATABASE_URL":"postgresql://helpdesk:<strong-password>@postgres:5432/helpdesk"}}'
```

### Step 5: Create ConfigMaps

ConfigMaps store non-sensitive configuration:

```bash
oc apply -f openshift/03-configmaps.yaml

# Verify ConfigMaps created
oc get configmaps | grep -E 'api-config|mailer-config'
```

**Note**: We'll update the FRONTEND_BASE_URL later once the route is created.

### Step 6: Deploy PostgreSQL

Create persistent volume claim and deploy database:

```bash
# Create PVC
oc apply -f openshift/04-postgres-pvc.yaml

# Verify PVC is bound (may take a moment)
oc get pvc postgres-pvc

# Deploy PostgreSQL
oc apply -f openshift/05-postgres-deployment.yaml

# Create PostgreSQL service
oc apply -f openshift/06-postgres-service.yaml

# Watch deployment
oc get pods -w -l app=postgres

# Wait until pod is Running and Ready (Ctrl+C to exit watch)
# Check logs
oc logs -f deployment/postgres
```

### Step 7: Deploy MailHog

Deploy the email testing service:

```bash
# Deploy MailHog
oc apply -f openshift/07-mailhog-deployment.yaml

# Create MailHog service
oc apply -f openshift/08-mailhog-service.yaml

# Create MailHog route (public access to UI)
oc apply -f openshift/09-mailhog-route.yaml

# Get MailHog URL
oc get route mailhog -o jsonpath='{.spec.host}'

# Verify MailHog is running
oc get pods -l app=mailhog
```

### Step 8: Build and Push Images

#### Option A: Using Docker

```bash
# Login to OpenShift registry
docker login -u $(oc whoami) -p $(oc whoami -t) default-route-openshift-image-registry.apps.<cluster-domain>

# Build images
cd helpdesk-ticketing-app
docker build -t api:latest ./backend
docker build -t mailer:latest ./mailer
docker build -t frontend:latest ./frontend

# Tag for OpenShift registry
REGISTRY=$(oc get route default-route -n openshift-image-registry -o jsonpath='{.spec.host}')
docker tag api:latest ${REGISTRY}/helpdesk/api:latest
docker tag mailer:latest ${REGISTRY}/helpdesk/mailer:latest
docker tag frontend:latest ${REGISTRY}/helpdesk/frontend:latest

# Push to registry
docker push ${REGISTRY}/helpdesk/api:latest
docker push ${REGISTRY}/helpdesk/mailer:latest
docker push ${REGISTRY}/helpdesk/frontend:latest
```

#### Option B: Using OpenShift BuildConfig (Source-to-Image)

```bash
# Create BuildConfigs for each service
oc new-build --name=api --binary --strategy=docker -n helpdesk
oc new-build --name=mailer --binary --strategy=docker -n helpdesk
oc new-build --name=frontend --binary --strategy=docker -n helpdesk

# Start builds
oc start-build api --from-dir=./backend --follow -n helpdesk
oc start-build mailer --from-dir=./mailer --follow -n helpdesk
oc start-build frontend --from-dir=./frontend --follow -n helpdesk

# Verify builds completed
oc get builds -n helpdesk
```

### Step 9: Deploy Backend API

```bash
# Deploy API
oc apply -f openshift/10-api-deployment.yaml

# Create API service
oc apply -f openshift/11-api-service.yaml

# Create API route
oc apply -f openshift/12-api-route.yaml

# Watch deployment
oc get pods -w -l app=api

# Get API URL
API_URL=$(oc get route api -o jsonpath='{.spec.host}')
echo "API URL: https://${API_URL}"

# Test API
curl https://${API_URL}
```

### Step 10: Deploy Mailer Service

```bash
# Deploy Mailer
oc apply -f openshift/13-mailer-deployment.yaml

# Watch deployment
oc get pods -l app=mailer

# Check mailer logs to ensure it's polling
oc logs -f deployment/mailer
```

### Step 11: Deploy Frontend

```bash
# Deploy Frontend
oc apply -f openshift/14-frontend-deployment.yaml

# Create Frontend service
oc apply -f openshift/15-frontend-service.yaml

# Create Frontend route
oc apply -f openshift/16-frontend-route.yaml

# Get Frontend URL
FRONTEND_URL=$(oc get route frontend -o jsonpath='{.spec.host}')
echo "Frontend URL: https://${FRONTEND_URL}"
```

### Step 12: Update ConfigMap with Route URLs

Now that routes are created, update the API ConfigMap:

```bash
# Get the frontend route
FRONTEND_URL=$(oc get route frontend -n helpdesk -o jsonpath='{.spec.host}')

# Update API ConfigMap with HTTPS URL
oc patch configmap api-config -n helpdesk -p "{\"data\":{\"FRONTEND_BASE_URL\":\"https://${FRONTEND_URL}\"}}"

# Rollout API deployment to pick up new config
oc rollout latest dc/api -n helpdesk

# Wait for rollout to complete
oc rollout status dc/api -n helpdesk
```

### Step 13: Verify Deployment

```bash
# Check all pods are running
oc get pods -n helpdesk

# Expected output:
# NAME                  READY   STATUS    RESTARTS   AGE
# api-X-XXXXX           1/1     Running   0          5m
# api-X-YYYYY           1/1     Running   0          5m
# frontend-X-XXXXX      1/1     Running   0          3m
# frontend-X-YYYYY      1/1     Running   0          3m
# mailer-X-XXXXX        1/1     Running   0          4m
# mailhog-X-XXXXX       1/1     Running   0          8m
# postgres-X-XXXXX      1/1     Running   0          10m

# Check all routes
oc get routes -n helpdesk

# Test each route
curl -k https://$(oc get route api -o jsonpath='{.spec.host}')
curl -k https://$(oc get route frontend -o jsonpath='{.spec.host}')/health
curl -k https://$(oc get route mailhog -o jsonpath='{.spec.host}')
```

## Accessing the Application

```bash
# Get all URLs
echo "Frontend: https://$(oc get route frontend -n helpdesk -o jsonpath='{.spec.host}')"
echo "API: https://$(oc get route api -n helpdesk -o jsonpath='{.spec.host}')"
echo "MailHog: https://$(oc get route mailhog -n helpdesk -o jsonpath='{.spec.host}')"
```

## Scaling the Application

### Scale API

```bash
# Scale to 3 replicas
oc scale dc/api --replicas=3 -n helpdesk

# Verify scaling
oc get pods -l app=api -n helpdesk

# Scale back to 2
oc scale dc/api --replicas=2 -n helpdesk
```

### Scale Frontend

```bash
# Scale to 4 replicas
oc scale dc/frontend --replicas=4 -n helpdesk

# Verify
oc get pods -l app=frontend -n helpdesk
```

### Auto-scaling (Optional)

```bash
# Create HorizontalPodAutoscaler for API
oc autoscale dc/api --min=2 --max=5 --cpu-percent=80 -n helpdesk

# Check HPA status
oc get hpa -n helpdesk
```

## Monitoring and Debugging

### View Logs

```bash
# API logs
oc logs -f dc/api -n helpdesk

# Mailer logs
oc logs -f dc/mailer -n helpdesk

# Frontend logs
oc logs -f dc/frontend -n helpdesk

# Database logs
oc logs -f dc/postgres -n helpdesk

# All pods with label
oc logs -f -l app=api -n helpdesk --tail=100
```

### Debug Pod Issues

```bash
# Describe pod
oc describe pod <pod-name> -n helpdesk

# Get events
oc get events -n helpdesk --sort-by='.lastTimestamp'

# Shell into pod
oc rsh <pod-name> -n helpdesk

# Check environment variables
oc exec <pod-name> -n helpdesk -- env

# Test database connection from API pod
oc exec deployment/api -n helpdesk -- nc -zv postgres 5432
```

### Database Operations

```bash
# Connect to database
oc rsh deployment/postgres -n helpdesk
psql -U helpdesk -d helpdesk

# Run SQL queries
\dt                          # List tables
SELECT * FROM users;         # View users
SELECT * FROM email_outbox;  # View email queue
\q                           # Exit

# Backup database
oc exec deployment/postgres -n helpdesk -- pg_dump -U helpdesk helpdesk > backup.sql

# Restore database
cat backup.sql | oc exec -i deployment/postgres -n helpdesk -- psql -U helpdesk helpdesk
```

## Updates and Rollbacks

### Update Application

```bash
# Rebuild and push new image
docker build -t api:latest ./backend
docker tag api:latest ${REGISTRY}/helpdesk/api:latest
docker push ${REGISTRY}/helpdesk/api:latest

# Trigger rollout (automatic if ImageChange trigger is set)
oc rollout latest dc/api -n helpdesk

# Or manually
oc rollout restart dc/api -n helpdesk

# Watch rollout
oc rollout status dc/api -n helpdesk
```

### Rollback

```bash
# View rollout history
oc rollout history dc/api -n helpdesk

# Rollback to previous version
oc rollout undo dc/api -n helpdesk

# Rollback to specific revision
oc rollout undo dc/api --to-revision=2 -n helpdesk
```

## Resource Management

### View Resource Usage

```bash
# Pod resource usage
oc adm top pods -n helpdesk

# Node resource usage
oc adm top nodes

# Describe resource quotas (if any)
oc describe quota -n helpdesk
```

### Update Resource Limits

Edit the deployment YAML and apply:

```bash
oc edit dc/api -n helpdesk
# Update resources section
# Apply changes
```

## Cleanup

### Delete Everything

```bash
# Delete entire namespace
oc delete namespace helpdesk

# Or delete individual components
oc delete all -l app=api -n helpdesk
oc delete all -l app=frontend -n helpdesk
oc delete all -l app=mailer -n helpdesk
oc delete all -l app=postgres -n helpdesk
oc delete all -l app=mailhog -n helpdesk
oc delete pvc postgres-pvc -n helpdesk
oc delete configmap -l app=helpdesk -n helpdesk
oc delete secret -l app=helpdesk -n helpdesk
```

## Troubleshooting Common Issues

### Issue: Pods stuck in ImagePullBackOff

```bash
# Check ImageStream
oc get is -n helpdesk

# Check if image exists
oc describe is/api -n helpdesk

# Verify image was pushed correctly
oc get imagestream api -o json | jq '.status.tags'
```

### Issue: API can't connect to database

```bash
# Verify database is running
oc get pods -l app=postgres

# Check database service
oc get svc postgres

# Test connection from API pod
oc exec deployment/api -- nc -zv postgres 5432

# Verify DATABASE_URL secret
oc get secret app-secret -o jsonpath='{.data.DATABASE_URL}' | base64 -d
```

### Issue: Mailer not sending emails

```bash
# Check mailer logs
oc logs -f dc/mailer

# Verify mailer can reach MailHog
oc exec deployment/mailer -- nc -zv mailhog 1025

# Check email_outbox table
oc exec deployment/postgres -- psql -U helpdesk -d helpdesk -c "SELECT * FROM email_outbox WHERE sent = false;"
```

### Issue: Frontend can't reach API

```bash
# Check frontend environment
oc exec deployment/frontend -- cat /etc/nginx/conf.d/default.conf

# Verify API route is accessible
curl -k https://$(oc get route api -o jsonpath='{.spec.host}')

# Check CORS configuration in API
oc logs dc/api | grep -i cors
```

## Security Best Practices

1. **Update Secrets**: Change default passwords and JWT secret
2. **Network Policies**: Implement network policies to restrict pod communication
3. **RBAC**: Use service accounts with minimal permissions
4. **TLS**: Ensure all routes use TLS (edge termination)
5. **Image Scanning**: Scan container images for vulnerabilities
6. **Resource Limits**: Set appropriate resource requests and limits
7. **Pod Security**: Enable pod security standards

## Production Checklist

- [ ] Updated all secrets with secure values
- [ ] Configured resource limits and requests
- [ ] Set up monitoring and alerting
- [ ] Configured database backups
- [ ] Implemented network policies
- [ ] Enabled auto-scaling
- [ ] Tested disaster recovery procedures
- [ ] Configured proper logging
- [ ] Set up health checks
- [ ] Reviewed security policies
- [ ] Configured proper CORS settings
- [ ] Set up real SMTP provider (not MailHog)
- [ ] Implemented rate limiting
- [ ] Added application monitoring (APM)
- [ ] Configured proper ingress/routes
- [ ] Set up CI/CD pipeline

## Support

For issues and questions:
- Check logs: `oc logs -f <pod-name>`
- Check events: `oc get events`
- Describe resources: `oc describe <resource-type> <name>`
