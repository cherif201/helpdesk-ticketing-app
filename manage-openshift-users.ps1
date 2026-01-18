# Interactive User Management Script for OpenShift Database
# This script helps you view and delete test users from the OpenShift PostgreSQL database

$namespace = "chrif0709-dev"
$podName = "postgres-1-sfksn"

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "OpenShift Database User Management" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Function to get all users
function Get-AllUsers {
    $result = oc exec $podName -n $namespace -- psql -U helpdesk -d helpdesk -t -A -F'|' -c "SELECT id, email, role, COALESCE(\`"firstName\`", ''), COALESCE(\`"lastName\`", ''), \`"createdAt\`" FROM users ORDER BY \`"createdAt\`" DESC;" 2>&1
    return $result
}

# Function to delete user by email
function Remove-UserByEmail {
    param($email)
    $escapedEmail = $email -replace "'", "''"
    oc exec $podName -n $namespace -- psql -U helpdesk -d helpdesk -c "DELETE FROM users WHERE email='$escapedEmail';"
}

# Main loop
$continue = $true
while ($continue) {
    Write-Host "`nFetching users from OpenShift database..." -ForegroundColor Yellow
    
    # Get users and parse
    $usersRaw = Get-AllUsers
    $users = @()
    $index = 1
    
    foreach ($line in $usersRaw) {
        if ($line -and $line -match '\|' -and $line -notmatch 'command terminated') {
            $parts = $line -split '\|', 6
            if ($parts.Count -ge 5) {
                $users += [PSCustomObject]@{
                    Index = $index
                    Id = $parts[0].Trim()
                    Email = $parts[1].Trim()
                    Role = $parts[2].Trim()
                    FirstName = $parts[3].Trim()
                    LastName = $parts[4].Trim()
                    CreatedAt = if ($parts.Count -ge 6) { $parts[5].Trim() } else { "" }
                }
                $index++
            }
        }
    }
    
    if ($users.Count -eq 0) {
        Write-Host "`nNo users found or error fetching users." -ForegroundColor Red
        Write-Host "Raw output:" -ForegroundColor Yellow
        $usersRaw | ForEach-Object { Write-Host $_ }
        break
    }
    
    # Display users
    Write-Host "`n--- Current Users ($($users.Count) total) ---" -ForegroundColor Green
    Write-Host ("=" * 120)
    Write-Host ("{0,-5} {1,-40} {2,-10} {3,-30} {4,-25}" -f "No.", "Email", "Role", "Name", "Created") -ForegroundColor Cyan
    Write-Host ("=" * 120)
    
    foreach ($user in $users) {
        $name = "$($user.FirstName) $($user.LastName)".Trim()
        if ([string]::IsNullOrWhiteSpace($name)) { $name = "(no name)" }
        
        $color = "White"
        if ($user.Role -eq "ADMIN") { $color = "Green" }
        elseif ([string]::IsNullOrWhiteSpace($user.FirstName) -and [string]::IsNullOrWhiteSpace($user.LastName)) { $color = "DarkGray" }
        
        $createdDisplay = if ($user.CreatedAt.Length -gt 19) { $user.CreatedAt.Substring(0,19) } else { $user.CreatedAt }
        Write-Host ("{0,-5} {1,-40} {2,-10} {3,-30} {4,-25}" -f $user.Index, $user.Email, $user.Role, $name, $createdDisplay) -ForegroundColor $color
    }
    Write-Host ("=" * 120)
    
    # Get user choice
    Write-Host "`nOptions:" -ForegroundColor Yellow
    Write-Host "  [Number] - Delete user by number (e.g., 1, 2, 3)"
    Write-Host "  [A] - Delete ALL test accounts (accounts without names)"
    Write-Host "  [M] - Delete multiple users (comma-separated, e.g., 1,3,5)"
    Write-Host "  [R] - Refresh list"
    Write-Host "  [Q] - Quit"
    Write-Host ""
    
    $choice = Read-Host "Enter your choice"
    
    switch -Regex ($choice.ToUpper()) {
        '^Q$' {
            $continue = $false
            Write-Host "`nExiting user management." -ForegroundColor Green
        }
        '^R$' {
            # Just continue to refresh
        }
        '^A$' {
            $testAccounts = $users | Where-Object { [string]::IsNullOrWhiteSpace($_.FirstName) -and [string]::IsNullOrWhiteSpace($_.LastName) -and $_.Role -ne "ADMIN" }
            if ($testAccounts.Count -eq 0) {
                Write-Host "`nNo test accounts found (accounts without names)." -ForegroundColor Yellow
            } else {
                Write-Host "`nFound $($testAccounts.Count) test account(s) without names:" -ForegroundColor Yellow
                foreach ($acc in $testAccounts) {
                    Write-Host "  - $($acc.Email)" -ForegroundColor DarkGray
                }
                $confirm = Read-Host "`nAre you sure you want to delete these accounts? (Y/N)"
                if ($confirm.ToUpper() -eq 'Y') {
                    foreach ($acc in $testAccounts) {
                        Write-Host "Deleting $($acc.Email)..." -ForegroundColor Red
                        Remove-UserByEmail -email $acc.Email
                    }
                    Write-Host "`nDeleted $($testAccounts.Count) test account(s)." -ForegroundColor Green
                    Start-Sleep -Seconds 2
                }
            }
        }
        '^M$' {
            $multiple = Read-Host "Enter user numbers separated by commas (e.g., 1,3,5)"
            $numbers = $multiple -split ',' | ForEach-Object { $_.Trim() }
            $toDelete = @()
            
            foreach ($num in $numbers) {
                if ($num -match '^\d+$') {
                    $userToDelete = $users | Where-Object { $_.Index -eq [int]$num }
                    if ($userToDelete) {
                        $toDelete += $userToDelete
                    }
                }
            }
            
            if ($toDelete.Count -gt 0) {
                Write-Host "`nYou selected:" -ForegroundColor Yellow
                foreach ($u in $toDelete) {
                    Write-Host "  - $($u.Email) ($($u.Role))" -ForegroundColor White
                }
                $confirm = Read-Host "`nDelete these $($toDelete.Count) user(s)? (Y/N)"
                if ($confirm.ToUpper() -eq 'Y') {
                    foreach ($u in $toDelete) {
                        Write-Host "Deleting $($u.Email)..." -ForegroundColor Red
                        Remove-UserByEmail -email $u.Email
                    }
                    Write-Host "`nDeleted $($toDelete.Count) user(s)." -ForegroundColor Green
                    Start-Sleep -Seconds 2
                }
            } else {
                Write-Host "`nNo valid users selected." -ForegroundColor Red
            }
        }
        '^\d+$' {
            $selectedIndex = [int]$choice
            $selectedUser = $users | Where-Object { $_.Index -eq $selectedIndex }
            
            if ($selectedUser) {
                Write-Host "`nSelected user:" -ForegroundColor Yellow
                Write-Host "  Email: $($selectedUser.Email)" -ForegroundColor White
                Write-Host "  Role: $($selectedUser.Role)" -ForegroundColor White
                Write-Host "  Name: $($selectedUser.FirstName) $($selectedUser.LastName)" -ForegroundColor White
                
                if ($selectedUser.Role -eq "ADMIN") {
                    Write-Host "`nWARNING: This is an ADMIN account!" -ForegroundColor Red
                }
                
                $confirm = Read-Host "`nAre you sure you want to delete this user? (Y/N)"
                if ($confirm.ToUpper() -eq 'Y') {
                    Write-Host "Deleting $($selectedUser.Email)..." -ForegroundColor Red
                    Remove-UserByEmail -email $selectedUser.Email
                    Write-Host "User deleted successfully." -ForegroundColor Green
                    Start-Sleep -Seconds 2
                }
            } else {
                Write-Host "`nInvalid user number." -ForegroundColor Red
            }
        }
        default {
            Write-Host "`nInvalid choice. Please try again." -ForegroundColor Red
            Start-Sleep -Seconds 1
        }
    }
}

Write-Host "`nDone!" -ForegroundColor Green
