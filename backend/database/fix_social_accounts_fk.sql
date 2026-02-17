-- Drop the incorrect constraint
ALTER TABLE public.social_accounts
DROP CONSTRAINT social_accounts_company_id_fkey;

-- Add the correct constraint referencing the company table
-- Assuming the table is named 'company' and the primary key column is 'companyId' based on companyController.js
ALTER TABLE public.social_accounts
ADD CONSTRAINT social_accounts_company_id_fkey
FOREIGN KEY (company_id) REFERENCES public.company("companyId") ON DELETE CASCADE;
