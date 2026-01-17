# Quick Start Guide

## OpenShift Deployment - Exact Commands

This guide provides the exact `oc` commands to deploy the Helpdesk Ticketing System on OpenShift from scratch.

### Prerequisites
```bash
# Verify oc is installed
oc version

# Login to OpenShift
oc login <your-cluster-url>

# Verify login
oc whoami
```

### Automated Deployment (Recommended)

```bash
# Make script executable
chmod +x deploy-openshift.sh

# Run deployment script
./deploy-openshift.sh
```

### Manual Deployment (Step-by-Step)

#### 1. Create Namespace
```bash
oc apply -f openshift/01-namespace.yaml
oc project helpdesk
```

#### 2. Create ImageStreams
```bash
oc apply -f openshift/00-imagestreams.yaml
```

#### 3. Create Secrets and ConfigMaps
```bash
oc apply -f openshift/02-secrets.yaml
oc apply -f openshift/03-configmaps.yaml
```

#### 4. Deploy PostgreSQL
```bash
oc apply -f openshift/04-postgres-pvc.yaml
oc apply -f openshift/05-postgres-deployment.yaml
oc apply -f openshift/06-postgres-service.yaml

# Wait for PostgreSQL to be ready
oc wait --for=condition=available --timeout=300s dc/postgres
```

#### 5. Deploy MailHog
```bash
oc apply -f openshift/07-mailhog-deployment.yaml
oc apply -f openshift/08-mailhog-service.yaml
oc apply -f openshift/09-mailhog-route.yaml

# Wait for MailHog to be ready
oc wait --for=condition=available --timeout=120s dc/mailhog
```

#### 6. Build and Push Images

**Option A: Using BuildConfig (Recommended)**
```bash
# Create BuildConfigs
oc new-build --name=api --binary --strategy=docker -n helpdesk
oc new-build --name=mailer --binary --strategy=docker -n helpdesk
oc new-build --name=frontend --binary --strategy=docker -n helpdesk

# Start builds
oc start-build api --from-dir=./backend --follow -n helpdesk
oc start-build mailer --from-dir=./mailer --follow -n helpdesk
oc start-build frontend --from-dir=./frontend --follow -n helpdesk
```

**Option B: Using Docker Push**
```bash
# Get registry route (if exposed)
REGISTRY=$(oc get route default-route -n openshift-image-registry -o jsonpath='{.spec.host}')

# Login to registry
docker login -u $(oc whoami) -p $(oc whoami -t) $REGISTRY

# Build images
docker build -t ${REGISTRY}/helpdesk/api:latest ./backend
docker build -t ${REGISTRY}/helpdesk/mailer:latest ./mailer
docker build -t ${REGISTRY}/helpdesk/frontend:latest ./frontend

# Push images
docker push ${REGISTRY}/helpdesk/api:latest
docker push ${REGISTRY}/helpdesk/mailer:latest
docker push ${REGISTRY}/helpdesk/frontend:latest
```

#### 7. Deploy API
```bash
oc apply -f openshift/10-api-deployment.yaml
oc apply -f openshift/11-api-service.yaml
oc apply -f openshift/12-api-route.yaml

# Wait for API to be ready
oc wait --for=condition=available --timeout=300s dc/api
```

#### 8. Deploy Mailer
```bash
oc apply -f openshift/13-mailer-deployment.yaml

# Wait for Mailer to be ready
oc wait --for=condition=available --timeout=180s dc/mailer
```

#### 9. Deploy Frontend
```bash
oc apply -f openshift/14-frontend-deployment.yaml
oc apply -f openshift/15-frontend-service.yaml
oc apply -f openshift/16-frontend-route.yaml

# Wait for Frontend to be ready
oc wait --for=condition=available --timeout=300s dc/frontend
```

#### 10. Update ConfigMap with Frontend URL
```bash
# Get frontend URL
FRONTEND_URL=$(oc get route frontend -n helpdesk -o jsonpath='{.spec.host}')

# Update API ConfigMap
oc patch configmap api-config -n helpdesk -p "{\"data\":{\"FRONTEND_BASE_URL\":\"https://${FRONTEND_URL}\"}}"

# Rollout API to pick up new config
oc rollout latest dc/api -n helpdesk
oc rollout status dc/api -n helpdesk
```

### Verify Deployment

```bash
# Check all pods are running
oc get pods -n helpdesk

# Expected output: All pods in Running state with 1/1 Ready

# Get application URLs
echo "Frontend: https://$(oc get route frontend -n helpdesk -o jsonpath='{.spec.host}')"
echo "API: https://$(oc get route api -n helpdesk -o jsonpath='{.spec.host}')"
echo "MailHog: https://$(oc get route mailhog -n helpdesk -o jsonpath='{.spec.host}')"
```

### Test the Deployment

```bash
# Test API
curl -k https://$(oc get route api -n helpdesk -o jsonpath='{.spec.host}')

# Test Frontend
curl -k https://$(oc get route frontend -n helpdesk -o jsonpath='{.spec.host}')/health

# Test MailHog
curl -k https://$(oc get route mailhog -n helpdesk -o jsonpath='{.spec.host}')
```

## Demo Scaling

### Scale API to 3 replicas
```bash
oc scale dc/api --replicas=3 -n helpdesk

# Watch scaling
oc get pods -l app=api -w -n helpdesk

# Verify 3 pods are running
oc get pods -l app=api -n helpdesk

# Test application still works
curl -k https://$(oc get route api -n helpdesk -o jsonpath='{.spec.host}')
```

### Scale Frontend to 4 replicas
```bash
oc scale dc/frontend --replicas=4 -n helpdesk

# Verify
oc get pods -l app=frontend -n helpdesk
```

### Scale back
```bash
oc scale dc/api --replicas=2 -n helpdesk
oc scale dc/frontend --replicas=2 -n helpdesk
```

## Common Operations

### View Logs
```bash
# API logs
oc logs -f dc/api -n helpdesk

# Mailer logs
oc logs -f dc/mailer -n helpdesk

# Frontend logs
oc logs -f dc/frontend -n helpdesk

# PostgreSQL logs
oc logs -f dc/postgres -n helpdesk

# MailHog logs
oc logs -f dc/mailhog -n helpdesk
```

### Database Access
```bash
# Connect to database
oc rsh deployment/postgres -n helpdesk
psql -U helpdesk -d helpdesk

# Inside psql:
\dt                          # List tables
SELECT * FROM users;         # View users
SELECT * FROM tickets;       # View tickets
SELECT * FROM email_outbox;  # View email queue
\q                           # Exit
```

### Update Secrets (Production)
```bash
# Update database password
oc patch secret postgres-secret -n helpdesk -p '{"stringData":{"POSTGRES_PASSWORD":"strong-password-here"}}'

# Update JWT secret
oc patch secret app-secret -n helpdesk -p '{"stringData":{"JWT_SECRET":"random-secret-key-here"}}'

# Update DATABASE_URL with new password
oc patch secret app-secret -n helpdesk -p '{"stringData":{"DATABASE_URL":"postgresql://helpdesk:strong-password-here@postgres:5432/helpdesk"}}'

# Rollout deployments to pick up new secrets
oc rollout latest dc/postgres -n helpdesk
oc rollout latest dc/api -n helpdesk
oc rollout latest dc/mailer -n helpdesk
```

### Cleanup
```bash
# Delete entire namespace (WARNING: Deletes all data)
oc delete namespace helpdesk

# Or delete specific resources
oc delete all,pvc,secret,configmap -l app=helpdesk -n helpdesk
```

## Local Development with Docker Compose

### Start Services
```bash
docker-compose up -d
```

### Access Services
- Frontend: http://localhost:8080
- API: http://localhost:3000
- MailHog UI: http://localhost:8025
- PostgreSQL: localhost:5432

### View Logs
```bash
docker-compose logs -f api
docker-compose logs -f mailer
docker-compose logs -f frontend
```

### Stop Services
```bash
docker-compose down

# Stop and remove volumes (WARNING: Deletes data)
docker-compose down -v
```

## Troubleshooting

### Pods not starting
```bash
# Check pod status
oc describe pod <pod-name> -n helpdesk

# Check events
oc get events -n helpdesk --sort-by='.lastTimestamp' | tail -20
```

### Image pull errors
```bash
# Check ImageStreams
oc get is -n helpdesk
oc describe is/api -n helpdesk

# Check builds
oc get builds -n helpdesk
oc logs build/<build-name> -n helpdesk
```

### Database connection issues
```bash
# Test from API pod
oc exec deployment/api -n helpdesk -- nc -zv postgres 5432

# Check DATABASE_URL
oc get secret app-secret -n helpdesk -o jsonpath='{.data.DATABASE_URL}' | base64 -d
```

### Emails not sending
```bash
# Check mailer logs
oc logs -f dc/mailer -n helpdesk

# Check email queue
oc exec deployment/postgres -n helpdesk -- psql -U helpdesk -d helpdesk -c "SELECT * FROM email_outbox WHERE sent = false;"

# Test MailHog connectivity
oc exec deployment/mailer -n helpdesk -- nc -zv mailhog 1025
```

## Demo Checklist

- [ ] All pods running (5 deployments)
- [ ] All routes accessible
- [ ] Database persistent storage mounted
- [ ] User signup works
- [ ] Welcome email received in MailHog
- [ ] Login works
- [ ] Ticket creation works
- [ ] Ticket status updates work
- [ ] Password reset flow works
- [ ] API scaling works (2 → 5 → 2 replicas)
- [ ] Frontend scaling works
- [ ] Application remains functional during scaling

## Next Steps

1. **Security**: Update all secrets with production values
2. **Monitoring**: Set up Prometheus/Grafana
3. **Backups**: Configure PostgreSQL backups
4. **CI/CD**: Create pipeline for automated deployments
5. **Email**: Replace MailHog with real SMTP provider
6. **SSL/TLS**: Ensure all routes use HTTPS
7. **Resource Limits**: Adjust based on load testing
8. **Auto-scaling**: Configure HPA for API and Frontend

## Support

For detailed documentation, see:
- [README.md](./README.md) - Main documentation
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Detailed deployment guide
- [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) - Complete demo walkthrough
