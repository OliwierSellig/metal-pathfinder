-- Migration: Create cleanup function for expired blocks
-- Purpose: Implement automatic cleanup mechanism for expired blocked tracks
-- Affected tables: blocked_tracks
-- Security considerations: Function removes only expired temporary blocks

-- create function to clean up expired blocked tracks
-- this function deletes all blocks where expires_at is not null and has passed
create or replace function cleanup_expired_blocks()
returns void
language plpgsql
security definer -- run with elevated privileges to delete across all users
as $$
declare
    deleted_count integer;
begin
    -- delete expired blocks (where expires_at is not null and has passed)
    delete from blocked_tracks
    where expires_at is not null
    and expires_at <= now();
    
    -- get count of deleted rows for logging
    get diagnostics deleted_count = row_count;
    
    -- log the cleanup action with timestamp and count
    raise notice 'Cleaned up % expired blocks at %', deleted_count, now();
exception
    when others then
        -- log any errors that occur during cleanup
        raise warning 'Error during cleanup_expired_blocks: %', sqlerrm;
        -- re-raise the exception so calling code is aware of the failure
        raise;
end;
$$;

-- grant execute permission to authenticated users for manual cleanup if needed
grant execute on function cleanup_expired_blocks() to authenticated;

-- add comment documenting the function's purpose and usage
comment on function cleanup_expired_blocks() is 
'Removes expired temporary blocks from blocked_tracks table. Should be called periodically via cron or trigger.'; 