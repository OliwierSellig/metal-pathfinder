-- Migration: Enable comprehensive RLS policies for blocked_tracks table
-- Purpose: Implement Row Level Security with granular CRUD policies for user blocked tracks
-- Affected tables: blocked_tracks
-- Security considerations: Ensures users can only access their own blocked tracks data
-- Dependencies: Requires Supabase Auth (auth.uid() function)

-- enable row level security for blocked_tracks table
alter table blocked_tracks enable row level security;

-- ============================================================================
-- SELECT POLICIES
-- ============================================================================

-- policy for authenticated users to select their own blocked tracks
-- rationale: authenticated users should only see tracks they have blocked themselves
create policy "authenticated_users_select_own_blocked_tracks" on blocked_tracks
    for select 
    to authenticated 
    using (auth.uid() = user_id);

-- policy for anonymous users - no select access to blocked tracks data
-- rationale: anonymous users should not have any access to private blocked tracks lists
create policy "anonymous_users_no_select_blocked_tracks" on blocked_tracks
    for select 
    to anon 
    using (false);

-- ============================================================================
-- INSERT POLICIES  
-- ============================================================================

-- policy for authenticated users to insert tracks into their own blocked list
-- rationale: authenticated users should only be able to block tracks for themselves
create policy "authenticated_users_insert_own_blocked_tracks" on blocked_tracks
    for insert 
    to authenticated 
    with check (auth.uid() = user_id);

-- policy for anonymous users - no insert access to blocked tracks data
-- rationale: anonymous users should not be able to block any tracks
create policy "anonymous_users_no_insert_blocked_tracks" on blocked_tracks
    for insert 
    to anon 
    with check (false);

-- ============================================================================
-- UPDATE POLICIES
-- ============================================================================

-- policy for authenticated users to update their own blocked tracks
-- rationale: authenticated users should only be able to modify their own blocked tracks (e.g., change expiry time)
create policy "authenticated_users_update_own_blocked_tracks" on blocked_tracks
    for update 
    to authenticated 
    using (auth.uid() = user_id);

-- policy for anonymous users - no update access to blocked tracks data
-- rationale: anonymous users should not be able to modify any blocked tracks data
create policy "anonymous_users_no_update_blocked_tracks" on blocked_tracks
    for update 
    to anon 
    using (false);

-- ============================================================================
-- DELETE POLICIES
-- ============================================================================

-- policy for authenticated users to delete tracks from their own blocked list
-- rationale: authenticated users should only be able to unblock tracks they have blocked themselves
create policy "authenticated_users_delete_own_blocked_tracks" on blocked_tracks
    for delete 
    to authenticated 
    using (auth.uid() = user_id);

-- policy for anonymous users - no delete access to blocked tracks data
-- rationale: anonymous users should not be able to unblock any tracks
create policy "anonymous_users_no_delete_blocked_tracks" on blocked_tracks
    for delete 
    to anon 
    using (false); 