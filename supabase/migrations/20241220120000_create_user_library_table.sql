-- Migration: Create user_library table
-- Purpose: Store user's music library with many-to-many relationship between users and Spotify tracks
-- Affected tables: user_library
-- Dependencies: Supabase Auth (auth.users table)

-- create the user_library table to store user's spotify track collections
create table user_library (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    spotify_track_id varchar(22) not null,
    created_at timestamptz default now() not null,
    constraint unique_user_track unique (user_id, spotify_track_id)
);

-- enable row level security for data isolation between users
alter table user_library enable row level security;

-- create policy for select operations - users can only access their own library
create policy "Users can select their own library tracks" on user_library
    for select using (auth.uid() = user_id);

-- create policy for insert operations - users can only add tracks to their own library
create policy "Users can insert tracks to their own library" on user_library
    for insert with check (auth.uid() = user_id);

-- create policy for update operations - users can only update their own library tracks
create policy "Users can update their own library tracks" on user_library
    for update using (auth.uid() = user_id);

-- create policy for delete operations - users can only delete from their own library
create policy "Users can delete their own library tracks" on user_library
    for delete using (auth.uid() = user_id);

-- create policy for anonymous users (no access to library data)
create policy "Anonymous users have no access to user_library" on user_library
    for all using (false); 