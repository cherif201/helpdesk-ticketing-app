#!/usr/bin/env pwsh
# Stop all Helpdesk services in OpenShift
# Use this to save resources when not using the application

param(
    [string]$Namespace = "chrif0709-dev"
)

$ErrorActionPreference = "Continue"

Write-Host "`n==> Stopping all Helpdesk services in namespace: $Namespace" -ForegroundColor Yellow

oc scale dc/frontend --replicas=0 -n $Namespace 2>&1 | Out-Null
Write-Host "[1/4] Frontend stopped" -ForegroundColor Gray

oc scale dc/api --replicas=0 -n $Namespace 2>&1 | Out-Null
Write-Host "[2/4] API stopped" -ForegroundColor Gray

oc scale dc/mailer --replicas=0 -n $Namespace 2>&1 | Out-Null
Write-Host "[3/4] Mailer stopped" -ForegroundColor Gray

oc scale dc/postgres --replicas=0 -n $Namespace 2>&1 | Out-Null
Write-Host "[4/4] PostgreSQL stopped" -ForegroundColor Gray

Write-Host "`n==> All services stopped successfully!" -ForegroundColor Green
Write-Host "    To restart: .\start-openshift.ps1`n" -ForegroundColor Cyan
