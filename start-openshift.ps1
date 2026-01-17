#!/usr/bin/env pwsh
# Quick Start/Restart Script for OpenShift Helpdesk Application
# Use this script to start all services when they're scaled down

param(
    [string]$Namespace = "chrif0709-dev"
)

$ErrorActionPreference = "Continue"

Write-Host "`n==> Starting all Helpdesk services in namespace: $Namespace" -ForegroundColor Cyan

# Scale up all services
Write-Host "[1/4] Starting PostgreSQL..." -ForegroundColor Yellow
oc scale dc/postgres --replicas=1 -n $Namespace 2>&1 | Out-Null

Write-Host "[2/4] Starting Mailer service..." -ForegroundColor Yellow
oc scale dc/mailer --replicas=1 -n $Namespace 2>&1 | Out-Null

Write-Host "[3/4] Starting API (2 replicas)...\" -ForegroundColor Yellow
oc scale dc/api --replicas=2 -n $Namespace 2>&1 | Out-Null

Write-Host "[4/4] Starting Frontend (2 replicas)..." -ForegroundColor Yellow
oc scale dc/frontend --replicas=2 -n $Namespace 2>&1 | Out-Null

Write-Host "`n==> Waiting for pods to be ready..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

$maxWait = 180
$waited = 0
$allReady = $false

while ($waited -lt $maxWait -and -not $allReady) {
    $pods = oc get pods -n $Namespace --no-headers 2>&1 | Where-Object { $_ -match '1/1.*Running' -and $_ -notmatch 'deploy|build' }
    $runningCount = ($pods | Measure-Object).Count
    
    if ($runningCount -ge 6) {  # postgres, mailer, 2x api, 2x frontend
        $allReady = $true
        break
    }
    
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 5
    $waited += 5
}

Write-Host "`n"

if ($allReady) {
    Write-Host "==> All services are running!" -ForegroundColor Green
    
    # Get routes
    $frontendRoute = oc get route frontend -n $Namespace -o jsonpath='{.spec.host}' 2>&1
    $apiRoute = oc get route api -n $Namespace -o jsonpath='{.spec.host}' 2>&1
    
    Write-Host @"

APPLICATION URLS:
   Frontend:  https://$frontendRoute
   API:       https://$apiRoute
   Swagger:   https://$apiRoute/api/docs

"@ -ForegroundColor Cyan
    
    # Ask to open browser
    $open = Read-Host "Open frontend in browser? (Y/n)"
    if ($open -ne 'n') {
        Start-Process "https://$frontendRoute"
    }
} else {
    Write-Host "==> Some services are still starting. Check status with:" -ForegroundColor Yellow
    Write-Host "    oc get pods -n $Namespace" -ForegroundColor White
}

Write-Host "`nTo stop all services (save resources):" -ForegroundColor Gray
Write-Host "    .\stop-openshift.ps1`n" -ForegroundColor White
