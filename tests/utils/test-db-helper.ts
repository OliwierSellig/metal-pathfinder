import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/db/database.types";

/**
 * Helper class for managing test database operations
 * Provides utilities for cleaning up test data before/after tests
 */
export class TestDatabaseHelper {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_PUBLIC_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing test Supabase credentials. Check your .env.test file.");
    }

    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
  }

  /**
   * Cleans all test data for the specified user
   * Should be called before/after each test to ensure clean state
   */
  async cleanUserData(userId: string): Promise<void> {
    try {
      // Clean user library
      await this.supabase.from("user_library").delete().eq("user_id", userId);

      // Clean blocked tracks
      await this.supabase.from("blocked_tracks").delete().eq("user_id", userId);

      console.log(`✅ Cleaned test data for user: ${userId}`);
    } catch (error) {
      console.error("❌ Failed to clean test data:", error);
      throw error;
    }
  }

  /**
   * Gets current user library for verification
   */
  async getUserLibrary(userId: string) {
    const { data, error } = await this.supabase
      .from("user_library")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Gets blocked tracks for user for verification
   */
  async getBlockedTracks(userId: string) {
    const { data, error } = await this.supabase
      .from("blocked_tracks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Adds a track to user's library (for test setup)
   */
  async addTrackToLibrary(userId: string, spotifyTrackId: string) {
    const { data, error } = await this.supabase
      .from("user_library")
      .insert({
        user_id: userId,
        spotify_track_id: spotifyTrackId,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Blocks a track for user (for test setup)
   */
  async blockTrack(userId: string, spotifyTrackId: string, duration: "1d" | "7d" | "permanent" = "permanent") {
    let expiresAt: string | null = null;

    if (duration === "1d") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expiresAt = tomorrow.toISOString();
    } else if (duration === "7d") {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      expiresAt = nextWeek.toISOString();
    }

    const { data, error } = await this.supabase
      .from("blocked_tracks")
      .insert({
        user_id: userId,
        spotify_track_id: spotifyTrackId,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Verifies that a track exists in user's library
   */
  async verifyTrackInLibrary(userId: string, spotifyTrackId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("user_library")
      .select("id")
      .eq("user_id", userId)
      .eq("spotify_track_id", spotifyTrackId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" error, which is expected
      throw error;
    }

    return !!data;
  }

  /**
   * Verifies that a track is blocked for user
   */
  async verifyTrackIsBlocked(userId: string, spotifyTrackId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("blocked_tracks")
      .select("id, expires_at")
      .eq("user_id", userId)
      .eq("spotify_track_id", spotifyTrackId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (!data) {
      return false;
    }

    // Check if block is still active (not expired)
    if (data.expires_at) {
      const expiresAt = new Date(data.expires_at);
      const now = new Date();
      return now < expiresAt;
    }

    // Permanent block
    return true;
  }
}

/**
 * Singleton instance for test database operations
 */
export const testDb = new TestDatabaseHelper();
