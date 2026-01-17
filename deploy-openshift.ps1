#!/usr/bin/env pwsh
# OpenShift Deployment Script for Helpdesk Ticketing System
# PowerShell 5.1+ / PowerShell Core 7+

param(
    [switch]$SkipLogin,
    [switch]$SkipBuild
)

$ErrorActionPreference = "Continue"

# Colors
function Write-Success { Write-Host "[OK] $args" -ForegroundColor Green }
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Cyan }
function Write-Warning { Write-Host "[WARN] $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "[ERROR] $args" -ForegroundColor Red }
function Write-Step { Write-Host "`n===> $args" -ForegroundColor Magenta }

Write-Host @"
================================================================
    HELPDESK TICKETING SYSTEM - OPENSHIFT DEPLOYMENT          
================================================================
"@ -ForegroundColor Cyan

# Check prerequisites
Write-Step "Checking prerequisites..."

# Check oc CLI
try {
    $ocVersion = oc version --client -o json | ConvertFrom-Json
    Write-Success "OpenShift CLI: $($ocVersion.clientVersion.gitVersion)"
} catch {
    Write-Error "OpenShift CLI (oc) not found. Please install it first."
    Write-Info "Download from: https://mirror.openshift.com/pub/openshift-v4/clients/ocp/stable/"
    exit 1
}

# Check if logged in
if (-not $SkipLogin) {
    Write-Step "Checking OpenShift login..."
    try {
        $currentUser = oc whoami 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Not logged in"
        }
        Write-Success "Logged in as: $currentUser"
        
        $proceed = Read-Host "Continue with this account? (Y/n)"
        if ($proceed -eq 'n') {
            Write-Info "Please login first:"
            Write-Info "1. Go to your OpenShift console"
            Write-Info "2. Click your username → 'Copy login command'"
            Write-Info "3. Run the command in this terminal"
            Write-Info "4. Then run this script again"
            exit 0
        }
    } catch {
        Write-Warning "Not logged in to OpenShift"
        Write-Info "Please login first:"
        Write-Info "1. Sign up for free: https://developers.redhat.com/developer-sandbox"
        Write-Info "2. Get login command from OpenShift console"
        Write-Info "3. Run: oc login --token=... --server=..."
        Write-Info "4. Then run this script again with: .\deploy-openshift.ps1"
        exit 1
    }
}

# Use existing namespace (Developer Sandbox doesn't allow creating namespaces)
Write-Step "Using your project namespace..."
try {
    $currentProject = oc project -q 2>&1
    if ($LASTEXITCODE -ne 0) {
        # Try to get default project
        $projects = oc get projects -o json | ConvertFrom-Json
        $userProject = $projects.items | Where-Object { $_.metadata.name -like "*-dev" } | Select-Object -First 1
        if ($userProject) {
            oc project $userProject.metadata.name
            $currentProject = $userProject.metadata.name
        } else {
            Write-Error "No suitable project found. Please create one or use an existing project."
            exit 1
        }
    }
    Write-Success "Using namespace: $currentProject"
    $global:namespace = $currentProject
    
    # Function to apply YAML with namespace override
    function Apply-Yaml {
        param([string]$file)
        $content = Get-Content $file -Raw
        $content = $content -replace 'namespace: helpdesk', "namespace: $namespace"
        $tempFile = [System.IO.Path]::GetTempFileName()
        $content | Out-File -FilePath $tempFile -Encoding UTF8
        oc apply -f $tempFile
        Remove-Item $tempFile -Force
    }
} catch {
    Write-Error "Could not determine current project"
    exit 1
}

# Apply ImageStreams
Write-Step "Creating ImageStreams..."
Apply-Yaml "openshift/00-imagestreams.yaml"
Write-Success "ImageStreams created"

# Apply Secrets
Write-Step "Creating Secrets..."
Apply-Yaml "openshift/02-secrets.yaml"
Write-Success "Secrets created"

# Apply ConfigMaps
Write-Step "Creating ConfigMaps..."
Apply-Yaml "openshift/03-configmaps.yaml"
Write-Success "ConfigMaps created"

# Deploy PostgreSQL
Write-Step "Deploying PostgreSQL..."
Apply-Yaml "openshift/04-postgres-pvc.yaml"
Apply-Yaml "openshift/05-postgres-deployment.yaml"
Apply-Yaml "openshift/06-postgres-service.yaml"
Write-Success "PostgreSQL deployed"

Write-Info "Waiting for PostgreSQL to be ready..."
$maxWait = 120
$waited = 0
while ($waited -lt $maxWait) {
    $podStatus = oc get pods -l app=postgres -n $namespace -o jsonpath='{.items[0].status.phase}' 2>&1
    if ($podStatus -eq "Running") {
        Write-Success "PostgreSQL is ready"
        break
    }
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 5
    $waited += 5
}
if ($waited -ge $maxWait) {
    Write-Error "PostgreSQL did not start in time"
    exit 1
}

# Deploy MailHog
Write-Step "Deploying MailHog..."
Apply-Yaml "openshift/07-mailhog-deployment.yaml"
Apply-Yaml "openshift/08-mailhog-service.yaml"
Apply-Yaml "openshift/09-mailhog-route.yaml"
Write-Success "MailHog deployed"

# Build images
if (-not $SkipBuild) {
    Write-Step "Building container images..."
    
    # Check if BuildConfigs exist
    $bcExists = oc get bc -n $namespace 2>&1
    if ($LASTEXITCODE -ne 0 -or $bcExists -notmatch "api") {
        Write-Info "Creating BuildConfigs..."
        oc new-build --name=api --binary --strategy=docker -n $namespace 2>&1 | Out-Null
        oc new-build --name=mailer --binary --strategy=docker -n $namespace 2>&1 | Out-Null
        oc new-build --name=frontend --binary --strategy=docker -n $namespace 2>&1 | Out-Null
    }
    
    Write-Info "Building API image..."
    oc start-build api --from-dir=./backend --follow -n $namespace
    Write-Success "API image built"
    
    Write-Info "Building Mailer image..."
    oc start-build mailer --from-dir=./mailer --follow -n $namespace
    Write-Success "Mailer image built"
    
    Write-Info "Building Frontend image..."
    oc start-build frontend --from-dir=./frontend --follow -n $namespace
    Write-Success "Frontend image built"
} else {
    Write-Warning "Skipping image builds (--SkipBuild flag set)"
}

# Deploy API
Write-Step "Deploying API service..."
Apply-Yaml "openshift/10-api-deployment.yaml"
Apply-Yaml "openshift/11-api-service.yaml"
Apply-Yaml "openshift/12-api-route.yaml"
Write-Success "API deployed"

# Deploy Mailer
Write-Step "Deploying Mailer service..."
Apply-Yaml "openshift/13-mailer-deployment.yaml"
Write-Success "Mailer deployed"

# Deploy Frontend
Write-Step "Deploying Frontend..."
Apply-Yaml "openshift/14-frontend-deployment.yaml"
Apply-Yaml "openshift/15-frontend-service.yaml"
Apply-Yaml "openshift/16-frontend-route.yaml"
Write-Success "Frontend deployed"

# Update CORS configuration
Write-Step "Updating CORS configuration..."
Start-Sleep -Seconds 3
$frontendUrl = oc get route frontend -n $namespace -o jsonpath='{.spec.host}' 2>&1
if ($LASTEXITCODE -eq 0) {
    oc patch configmap api-config -n $namespace -p "{`"data`":{`"FRONTEND_BASE_URL`":`"https://$frontendUrl`"}}"
    Write-Success "CORS configured for: https://$frontendUrl"
    
    # Rollout API to apply changes
    Write-Info "Restarting API to apply CORS changes..."
    oc rollout latest dc/api -n $namespace 2>&1 | Out-Null
    Write-Success "API restarted"
} else {
    Write-Warning "Could not get frontend URL, CORS may need manual configuration"
}

# Wait for deployments
Write-Step "Waiting for all pods to be ready..."
Start-Sleep -Seconds 10

$maxWait = 180
$waited = 0
while ($waited -lt $maxWait) {
    $pods = oc get pods -n $namespace -o json | ConvertFrom-Json
    $allReady = $true
    
    foreach ($pod in $pods.items) {
        if ($pod.status.phase -ne "Running" -and $pod.status.phase -ne "Succeeded") {
            $allReady = $false
            break
        }
    }
    
    if ($allReady) {
        Write-Success "All pods are ready!"
        break
    }
    
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 5
    $waited += 5
}

if ($waited -ge $maxWait) {
    Write-Warning "Some pods are still not ready. Check status with: oc get pods -n $namespace"
}

# Get all routes
Write-Step "Getting application URLs..."
$frontendRoute = oc get route frontend -n $namespace -o jsonpath='{.spec.host}' 2>&1
$apiRoute = oc get route api -n $namespace -o jsonpath='{.spec.host}' 2>&1
$mailhogRoute = oc get route mailhog -n $namespace -o jsonpath='{.spec.host}' 2>&1

# Display summary
Write-Host @"

================================================================
              DEPLOYMENT SUCCESSFUL!                   
================================================================

APPLICATION URLS:
   Frontend:  https://$frontendRoute
   API:       https://$apiRoute
   Swagger:   https://$apiRoute/api/docs
   MailHog:   https://$mailhogRoute

USEFUL COMMANDS:
   View pods:        oc get pods -n $namespace
   View logs (API):  oc logs -f dc/api -n $namespace
   View routes:      oc get routes -n $namespace
   Scale API:        oc scale dc/api --replicas=3 -n $namespace

CHECK STATUS:
   oc get all -n $namespace

OPEN IN BROWSER:
   Start-Process "https://$frontendRoute"

"@ -ForegroundColor Green

# Ask if user wants to open browser
$openBrowser = Read-Host "`nOpen frontend in browser? (Y/n)"
if ($openBrowser -ne 'n') {
    Start-Process "https://$frontendRoute"
}

Write-Success "Deployment complete!"
