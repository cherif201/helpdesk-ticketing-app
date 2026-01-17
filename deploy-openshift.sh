#!/bin/bash

# OpenShift Deployment Script for Helpdesk Ticketing System
# This script automates the deployment process

set -e

echo "========================================="
echo "Helpdesk Ticketing System - OpenShift Deployment"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if oc is installed
if ! command -v oc &> /dev/null; then
    print_error "oc CLI not found. Please install OpenShift CLI."
    exit 1
fi

# Check if logged in
if ! oc whoami &> /dev/null; then
    print_error "Not logged in to OpenShift. Please run 'oc login' first."
    exit 1
fi

print_info "Logged in as: $(oc whoami)"
print_info "Current server: $(oc whoami --show-server)"
echo ""

# Step 1: Create namespace
print_info "Step 1: Creating namespace..."
oc apply -f openshift/01-namespace.yaml
oc project helpdesk
echo ""

# Step 2: Create ImageStreams
print_info "Step 2: Creating ImageStreams..."
oc apply -f openshift/00-imagestreams.yaml
echo ""

# Step 3: Create secrets
print_info "Step 3: Creating secrets..."
oc apply -f openshift/02-secrets.yaml
print_warning "Remember to update secrets with production values!"
echo ""

# Step 4: Create ConfigMaps
print_info "Step 4: Creating ConfigMaps..."
oc apply -f openshift/03-configmaps.yaml
echo ""

# Step 5: Deploy PostgreSQL
print_info "Step 5: Deploying PostgreSQL..."
oc apply -f openshift/04-postgres-pvc.yaml
oc apply -f openshift/05-postgres-deployment.yaml
oc apply -f openshift/06-postgres-service.yaml

print_info "Waiting for PostgreSQL to be ready..."
oc wait --for=condition=available --timeout=300s dc/postgres
echo ""

# Step 6: Deploy MailHog
print_info "Step 6: Deploying MailHog..."
oc apply -f openshift/07-mailhog-deployment.yaml
oc apply -f openshift/08-mailhog-service.yaml
oc apply -f openshift/09-mailhog-route.yaml

print_info "Waiting for MailHog to be ready..."
oc wait --for=condition=available --timeout=120s dc/mailhog
MAILHOG_URL=$(oc get route mailhog -o jsonpath='{.spec.host}')
print_info "MailHog UI: https://${MAILHOG_URL}"
echo ""

# Step 7: Build and push images
print_info "Step 7: Building and pushing images..."
print_warning "This step requires Docker/Podman and may take several minutes..."
echo ""

# Get registry info
REGISTRY=$(oc get route default-route -n openshift-image-registry -o jsonpath='{.spec.host}' 2>/dev/null || echo "image-registry.openshift-image-registry.svc:5000")

if [[ $REGISTRY == *"default-route"* ]]; then
    print_info "Using external registry route: $REGISTRY"
    # Login to registry
    print_info "Logging in to registry..."
    docker login -u $(oc whoami) -p $(oc whoami -t) $REGISTRY
else
    print_info "Using internal registry: $REGISTRY"
fi

# Build images
print_info "Building backend API image..."
docker build -t ${REGISTRY}/helpdesk/api:latest ./backend

print_info "Building mailer service image..."
docker build -t ${REGISTRY}/helpdesk/mailer:latest ./mailer

print_info "Building frontend image..."
docker build -t ${REGISTRY}/helpdesk/frontend:latest ./frontend

# Push images
if [[ $REGISTRY == *"default-route"* ]]; then
    print_info "Pushing images to registry..."
    docker push ${REGISTRY}/helpdesk/api:latest
    docker push ${REGISTRY}/helpdesk/mailer:latest
    docker push ${REGISTRY}/helpdesk/frontend:latest
else
    print_warning "Using internal registry. Images will be imported via oc import-image..."
    # For internal registry, we need to use oc import-image or build via BuildConfig
    # This is a fallback - using BuildConfig is recommended
    print_info "Creating BuildConfigs..."
    oc new-build --name=api --binary --strategy=docker -n helpdesk || true
    oc new-build --name=mailer --binary --strategy=docker -n helpdesk || true
    oc new-build --name=frontend --binary --strategy=docker -n helpdesk || true

    print_info "Starting builds..."
    oc start-build api --from-dir=./backend --follow -n helpdesk
    oc start-build mailer --from-dir=./mailer --follow -n helpdesk
    oc start-build frontend --from-dir=./frontend --follow -n helpdesk
fi
echo ""

# Step 8: Deploy API
print_info "Step 8: Deploying API..."
oc apply -f openshift/10-api-deployment.yaml
oc apply -f openshift/11-api-service.yaml
oc apply -f openshift/12-api-route.yaml

print_info "Waiting for API to be ready..."
oc wait --for=condition=available --timeout=300s dc/api
API_URL=$(oc get route api -o jsonpath='{.spec.host}')
print_info "API URL: https://${API_URL}"
echo ""

# Step 9: Deploy Mailer
print_info "Step 9: Deploying Mailer service..."
oc apply -f openshift/13-mailer-deployment.yaml

print_info "Waiting for Mailer to be ready..."
oc wait --for=condition=available --timeout=180s dc/mailer
echo ""

# Step 10: Deploy Frontend
print_info "Step 10: Deploying Frontend..."
oc apply -f openshift/14-frontend-deployment.yaml
oc apply -f openshift/15-frontend-service.yaml
oc apply -f openshift/16-frontend-route.yaml

print_info "Waiting for Frontend to be ready..."
oc wait --for=condition=available --timeout=300s dc/frontend
FRONTEND_URL=$(oc get route frontend -o jsonpath='{.spec.host}')
print_info "Frontend URL: https://${FRONTEND_URL}"
echo ""

# Step 11: Update ConfigMap with actual frontend URL
print_info "Step 11: Updating ConfigMap with frontend URL..."
oc patch configmap api-config -n helpdesk -p "{\"data\":{\"FRONTEND_BASE_URL\":\"https://${FRONTEND_URL}\"}}"

print_info "Rolling out API to pick up new configuration..."
oc rollout latest dc/api -n helpdesk
oc rollout status dc/api -n helpdesk
echo ""

# Final status
echo ""
echo "========================================="
print_info "Deployment Complete!"
echo "========================================="
echo ""
print_info "Application URLs:"
echo "  Frontend:  https://${FRONTEND_URL}"
echo "  API:       https://${API_URL}"
echo "  MailHog:   https://${MAILHOG_URL}"
echo ""

print_info "Check deployment status:"
echo "  oc get pods -n helpdesk"
echo ""

print_info "View logs:"
echo "  oc logs -f dc/api -n helpdesk"
echo "  oc logs -f dc/mailer -n helpdesk"
echo "  oc logs -f dc/frontend -n helpdesk"
echo ""

print_warning "Next Steps:"
echo "  1. Update secrets with production values"
echo "  2. Test the application"
echo "  3. Configure monitoring and alerts"
echo "  4. Set up database backups"
echo ""
