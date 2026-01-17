# Promote User to AGENT/ADMIN - Direct Database Access
# This script doesn't need pgAdmin!

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   User Role Management Script" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Show all users (using OpenShift direct access) (using OpenShift direct access)
Write-Host "Fetching all users from database..." -ForegroundColor Yellow
Write-Host "====================================`n" -ForegroundColor Cyan

oc exec -n chrif0709-dev pod/postgres-1-w2jc6 -- psql -U helpdesk -d helpdesk -c 'SELECT email, role, \"createdAt\" FROM users ORDER BY \"createdAt\" DESC LIMIT 10;'

# Step 4: Prompt for user email to promote
Write-Host "`n====================================`n" -ForegroundColor Cyan
$userEmail = Read-Host "Enter the email of the user you want to promote"

if (-not $userEmail) {
    Write-Host "❌ No email provided. Exiting." -ForegroundColor Red
    pause
    exit
}

# Step 5: Choose role
Write-Host "`nSelect role:" -ForegroundColor Yellow
Write-Host "  1. USER (default)" -ForegroundColor Gray
Write-Host "  2. AGENT (can assign tickets, add internal notes)" -ForegroundColor Green
Write-Host "  3. ADMIN (full access, can manage users)" -ForegroundColor Red

$roleChoice = Read-Host "`nEnter role number (1-3)"

$roleName = switch ($roleChoice) {
    "1" { "USER" }
    "2" { "AGENT" }
    "3" { "ADMIN" }
    default { "AGENT" }
}

# Step 6: Update user role (using OpenShift direct access)
Write-Host "`nPromoting $userEmail to $roleName..." -ForegroundColor Yellow

oc exec -n chrif0709-dev pod/postgres-1-w2jc6 -- psql -U helpdesk -d helpdesk -c "UPDATE users SET role = '$roleName' WHERE email = '$userEmail';"

# Step 7: Verify the change
Write-Host "`nVerifying the change..." -ForegroundColor Yellow

oc exec -n chrif0709-dev pod/postgres-1-w2jc6 -- psql -U helpdesk -d helpdesk -c "SELECT email, role FROM users WHERE email = '$userEmail';"

Write-Host "`n✅ Done!" -ForegroundColor Green
Write-Host "`n⚠️  IMPORTANT: User must LOGOUT and LOGIN again to see new features!" -ForegroundColor Red
Write-Host "`nFrontend URL: https://frontend-chrif0709-dev.apps.rm3.7wse.p1.openshiftapps.com`n" -ForegroundColor Cyan

pause
