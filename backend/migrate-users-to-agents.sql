-- Migration script to convert USER role to AGENT
-- Run this BEFORE applying the schema migration

UPDATE users 
SET role = 'AGENT' 
WHERE role = 'USER';

-- Verify the migration
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role;
