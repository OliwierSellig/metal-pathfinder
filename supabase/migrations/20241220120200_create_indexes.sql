-- Migration: Create performance indexes
-- Purpose: Add indexes for efficient querying of user libraries and blocked tracks
-- Affected tables: user_library, blocked_tracks
-- Performance considerations: Optimized for most common query patterns

-- index for efficient searching of user's library ordered by creation date (newest first)
-- this supports queries like "get user's recent library additions"
create index idx_user_library_user_id_created_at on user_library(user_id, created_at desc);

-- index for efficient searching of user's blocked tracks
-- this supports queries like "get all blocked tracks for a user"
create index idx_blocked_tracks_user_id on blocked_tracks(user_id);

-- partial index for efficient cleanup of expired blocks
-- only indexes rows where expires_at is not null (temporary blocks)
-- this supports the cleanup function that removes expired blocks
create index idx_blocked_tracks_expires_at on blocked_tracks(expires_at) 
where expires_at is not null;

-- composite index for checking if a specific track is blocked by a user
-- this supports queries like "is track X blocked by user Y?"
create index idx_blocked_tracks_user_spotify on blocked_tracks(user_id, spotify_track_id); 