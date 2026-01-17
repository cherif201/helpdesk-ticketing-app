-- Check all users and their roles
SELECT id, email, "firstName", "lastName", role, "createdAt" 
FROM "User" 
ORDER BY "createdAt" DESC;
