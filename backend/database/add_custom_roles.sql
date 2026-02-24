-- Add custom roles support to companies
ALTER TABLE company ADD COLUMN IF NOT EXISTS custom_roles JSONB DEFAULT '[]';
ALTER TABLE company ADD COLUMN IF NOT EXISTS collaborator_roles JSONB DEFAULT '{}';
