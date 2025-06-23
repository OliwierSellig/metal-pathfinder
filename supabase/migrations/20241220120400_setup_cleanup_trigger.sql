-- Migration: Setup automatic cleanup trigger
-- Purpose: Implement trigger-based cleanup mechanism as fallback for environments without pg_cron
-- Affected tables: blocked_tracks
-- Trigger strategy: Cleanup on insert operations to prevent table bloat

-- create trigger function to handle periodic cleanup of expired blocks
-- this approach uses opportunistic cleanup when new blocks are added
create or replace function trigger_cleanup_expired_blocks()
returns trigger
language plpgsql
security definer
as $$
declare
    last_cleanup_time timestamptz;
    cleanup_interval interval := '1 hour'; -- run cleanup max once per hour
begin
    -- check if we have any expired blocks that haven't been cleaned recently
    -- this prevents excessive cleanup operations on high-traffic systems
    select max(created_at) into last_cleanup_time
    from blocked_tracks
    where expires_at is not null 
    and expires_at <= now() - cleanup_interval;
    
    -- only run cleanup if we found expired blocks that are old enough
    if last_cleanup_time is not null then
        -- perform the cleanup of expired blocks
        delete from blocked_tracks
        where expires_at is not null
        and expires_at <= now();
        
        -- log the cleanup action
        raise notice 'Triggered cleanup of expired blocks at %', now();
    end if;
    
    -- return the new row to continue with the original insert operation
    return new;
exception
    when others then
        -- log any errors but don't fail the original insert operation
        raise warning 'Error during triggered cleanup: %', sqlerrm;
        -- return new row to allow original operation to succeed
        return new;
end;
$$;

-- create trigger that runs after insert operations on blocked_tracks
-- using "for each statement" to avoid running cleanup for every single row
create trigger trigger_cleanup_on_blocked_tracks_insert
    after insert on blocked_tracks
    for each statement
    execute function trigger_cleanup_expired_blocks();

-- add comment documenting the trigger's purpose and behavior
comment on function trigger_cleanup_expired_blocks() is 
'Opportunistic cleanup of expired blocks triggered by insert operations. Runs at most once per hour to prevent performance impact.'; 