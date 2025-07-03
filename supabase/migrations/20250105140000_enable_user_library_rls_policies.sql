-- Migration: Enable comprehensive RLS policies for user_library table
-- Purpose: Implement Row Level Security with granular CRUD policies for user music library
-- Affected tables: user_library
-- Security considerations: Ensures users can only access their own library data
-- Dependencies: Requires Supabase Auth (auth.uid() function)

-- enable row level security for user_library table
alter table user_library enable row level security;

-- ============================================================================
-- SELECT POLICIES
-- ============================================================================

-- policy for authenticated users to select their own library tracks
-- rationale: authenticated users should only see tracks in their personal library
create policy "authenticated_users_select_own_library" on user_library
    for select 
    to authenticated 
    using (auth.uid() = user_id);

-- policy for anonymous users - no select access to library data
-- rationale: anonymous users should not have any access to private user libraries
create policy "anonymous_users_no_select_library" on user_library
    for select 
    to anon 
    using (false);

-- ============================================================================
-- INSERT POLICIES  
-- ============================================================================

-- policy for authenticated users to insert tracks into their own library
-- rationale: authenticated users should only be able to add tracks to their own library
create policy "authenticated_users_insert_own_library" on user_library
    for insert 
    to authenticated 
    with check (auth.uid() = user_id);

-- policy for anonymous users - no insert access to library data
-- rationale: anonymous users should not be able to modify any library data
create policy "anonymous_users_no_insert_library" on user_library
    for insert 
    to anon 
    with check (false);

-- ============================================================================
-- UPDATE POLICIES
-- ============================================================================

-- policy for authenticated users to update their own library tracks
-- rationale: authenticated users should only be able to modify tracks in their own library
create policy "authenticated_users_update_own_library" on user_library
    for update 
    to authenticated 
    using (auth.uid() = user_id);

-- policy for anonymous users - no update access to library data
-- rationale: anonymous users should not be able to modify any library data
create policy "anonymous_users_no_update_library" on user_library
    for update 
    to anon 
    using (false);

-- ============================================================================
-- DELETE POLICIES
-- ============================================================================

-- policy for authenticated users to delete tracks from their own library
-- rationale: authenticated users should only be able to remove tracks from their own library
create policy "authenticated_users_delete_own_library" on user_library
    for delete 
    to authenticated 
    using (auth.uid() = user_id);

-- policy for anonymous users - no delete access to library data
-- rationale: anonymous users should not be able to delete any library data
create policy "anonymous_users_no_delete_library" on user_library
    for delete 
    to anon 
    using (false); 