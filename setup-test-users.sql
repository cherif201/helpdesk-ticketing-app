-- Setup Test Users for RBAC Features
-- Run this in pgAdmin after connecting to the database

-- 1. Check existing users
SELECT id, email, "firstName", "lastName", role, "createdAt" 
FROM "User" 
ORDER BY "createdAt" DESC;

-- 2. Promote a specific user to AGENT role
-- Replace 'your-email@example.com' with actual email from the query above
UPDATE "User" 
SET role = 'AGENT' 
WHERE email = 'mohamed.cherif.khcherif@gmail.com';

-- 3. Promote another user to ADMIN role (optional)
-- UPDATE "User" 
-- SET role = 'ADMIN' 
-- WHERE email = 'admin-email@example.com';

-- 4. Verify the role changes
SELECT id, email, "firstName", "lastName", role 
FROM "User" 
ORDER BY role, email;

-- 5. Check all tables exist (should return data for all)
SELECT COUNT(*) as user_count FROM "User";
SELECT COUNT(*) as ticket_count FROM "Ticket";
SELECT COUNT(*) as comment_count FROM "TicketComment";
SELECT COUNT(*) as audit_count FROM "AuditEvent";
SELECT COUNT(*) as migration_count FROM "_prisma_migrations";

-- 6. View the UserRole enum values
SELECT 
    pg_type.typname AS enum_name,
    pg_enum.enumlabel AS enum_value
FROM pg_type 
JOIN pg_enum ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname = 'UserRole'
ORDER BY pg_enum.enumsortorder;

-- 7. Check ticket schema (should see assignedToUserId column)
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Ticket'
ORDER BY ordinal_position;

-- 8. After promoting users, create a test ticket assigned to an agent
-- First, get an agent's ID
-- SELECT id FROM "User" WHERE role = 'AGENT' LIMIT 1;

-- Then create a ticket (replace IDs with actual values)
-- INSERT INTO "Ticket" (id, title, description, status, "userId", "assignedToUserId", "createdAt", "updatedAt")
-- VALUES (
--   gen_random_uuid(),
--   'Test Assigned Ticket',
--   'This ticket is assigned to an agent',
--   'OPEN',
--   'user-id-here',
--   'agent-id-here',
--   NOW(),
--   NOW()
-- );
