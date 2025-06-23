-- Migration: Create blocked_tracks table
-- Purpose: Store tracks blocked by users with temporal and permanent blocking mechanisms
-- Affected tables: blocked_tracks
-- Dependencies: Supabase Auth (auth.users table)

-- create the blocked_tracks table to store user's blocked spotify tracks
create table blocked_tracks (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    spotify_track_id varchar(22) not null,
    expires_at timestamptz null, -- null means permanent block
    created_at timestamptz default now() not null,
    constraint unique_user_blocked_track unique (user_id, spotify_track_id),
    constraint valid_expiry_date check (expires_at is null or expires_at > created_at)
);

-- enable row level security for data isolation between users
alter table blocked_tracks enable row level security;

-- create policy for select operations - users can only access their own blocked tracks
create policy "Users can select their own blocked tracks" on blocked_tracks
    for select using (auth.uid() = user_id);

-- create policy for insert operations - users can only add blocks to their own account
create policy "Users can insert their own blocked tracks" on blocked_tracks
    for insert with check (auth.uid() = user_id);

-- create policy for update operations - users can only update their own blocked tracks
create policy "Users can update their own blocked tracks" on blocked_tracks
    for update using (auth.uid() = user_id);

-- create policy for delete operations - users can only delete their own blocked tracks
create policy "Users can delete their own blocked tracks" on blocked_tracks
    for delete using (auth.uid() = user_id);

-- create policy for anonymous users (no access to blocked tracks data)
create policy "Anonymous users have no access to blocked_tracks" on blocked_tracks
    for all using (false); 