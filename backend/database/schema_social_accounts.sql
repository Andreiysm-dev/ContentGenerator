-- Create table for storing social media accounts (OAuth tokens)
create table public.social_accounts (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.profiles(id) on delete cascade not null,
  provider text not null, -- 'linkedin', 'twitter', etc.
  provider_account_id text not null, -- The user's ID on the platform (e.g. LinkedIn URN)
  profile_name text, -- Display name (e.g. 'Jane Doe')
  profile_picture text, -- URL to avatar
  access_token text not null, -- Encrypted or plain (depending on security needs, ideally encrypted)
  refresh_token text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  -- Ensure one account per provider per company (optional, remove if multiple accounts allowed)
  unique(company_id, provider, provider_account_id)
);

-- Enable RLS
alter table public.social_accounts enable row level security;

-- Policies
create policy "Users can view their company's social accounts"
  on public.social_accounts for select
  using ( auth.uid() = company_id ); -- Note: This assumes company_id IS the user_id (1:1), if it's Team based, update logic.
  -- Based on previous profileRoutes, profiles table seems to be 1:1 with auth.users for now or managed via simple ownership.
  -- Update this policy if company_id is distinct from auth.uid() in a complex way.

create policy "Users can insert their company's social accounts"
  on public.social_accounts for insert
  with check ( auth.uid() = company_id );

create policy "Users can update their company's social accounts"
  on public.social_accounts for update
  using ( auth.uid() = company_id );

create policy "Users can delete their company's social accounts"
  on public.social_accounts for delete
  using ( auth.uid() = company_id );
