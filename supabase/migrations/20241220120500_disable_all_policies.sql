-- Migration: Disable all RLS policies
-- Purpose: Remove all Row Level Security policies from user_library and blocked_tracks tables
-- Affected tables: user_library, blocked_tracks
-- Security considerations: This removes all access restrictions - tables will be fully accessible

-- drop all policies for user_library table
drop policy if exists "Users can select their own library tracks" on user_library;
drop policy if exists "Users can insert tracks to their own library" on user_library;
drop policy if exists "Users can update their own library tracks" on user_library;
drop policy if exists "Users can delete their own library tracks" on user_library;
drop policy if exists "Anonymous users have no access to user_library" on user_library;

-- drop all policies for blocked_tracks table
drop policy if exists "Users can select their own blocked tracks" on blocked_tracks;
drop policy if exists "Users can insert their own blocked tracks" on blocked_tracks;
drop policy if exists "Users can update their own blocked tracks" on blocked_tracks;
drop policy if exists "Users can delete their own blocked tracks" on blocked_tracks;
drop policy if exists "Anonymous users have no access to blocked_tracks" on blocked_tracks;

-- optionally, you can also disable row level security entirely for both tables
-- uncomment the lines below if you want to completely disable RLS
alter table user_library disable row level security;
alter table blocked_tracks disable row level security; 