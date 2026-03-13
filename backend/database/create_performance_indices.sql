-- Database Indexing for Performance Optimization
-- This script adds indices to frequently queried columns to improve speed as data grows.

-- 1. Index on companyId in contentCalendar
CREATE INDEX IF NOT EXISTS "idx_contentCalendar_companyId" ON public."contentCalendar" ("companyId");

-- 2. Index on companyId in brandKB
CREATE INDEX IF NOT EXISTS "idx_brandKB_companyId" ON public."brandKB" ("companyId");

-- 3. Index on company_id in scheduled_posts
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_company_id ON public.scheduled_posts (company_id);

-- 4. Index on user_id in company
CREATE INDEX IF NOT EXISTS idx_company_user_id ON public.company (user_id);

-- 5. Index on user_id in profiles
-- In this schema, 'id' is the primary key linking to auth.users. 
-- Primary keys are already indexed. If a separate user_id exists, we index it here.
-- Based on profiles_schema.sql, the lookup is on 'id'.
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles (id);

-- 6. GIN index for collaborator_ids array in company
-- Note: GIN is the standard and most efficient index for array containment (@>) 
-- operations used in the access checks. GIST does not support uuid[] natively 
-- without extra extensions and is typically slower for this use case.
CREATE INDEX IF NOT EXISTS idx_company_collaborator_ids ON public.company USING GIN (collaborator_ids);
