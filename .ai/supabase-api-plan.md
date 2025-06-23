# Supabase API Plan - MetalPathfinder

## 1. Resources

### Primary Resources

- **Library Tracks** (`user_library` table) - User's saved music library
- **Blocked Tracks** (`blocked_tracks` table) - Tracks blocked from recommendations

### Authentication

- **Users** - Handled entirely by Supabase Auth (no custom endpoints needed)

## 2. Endpoints

### 2.1 Library Management

#### GET /api/library

**Description:** Retrieve user's music library from database
**Authentication:** Required (Supabase JWT)
**Query Parameters:**

- `limit` (optional, default: 50, max: 100) - Number of tracks to return
- `offset` (optional, default: 0) - Pagination offset
- `sort` (optional, default: "created_at_desc") - Sort order: `created_at_desc`, `created_at_asc`

**Response:**

```json
{
  "tracks": [
    {
      "spotify_track_id": "string",
      "created_at": "2024-01-01T12:00:00Z"
    }
  ],
  "total_count": 42,
  "has_more": true
}
```

**Success Codes:**

- `200 OK` - Library retrieved successfully

**Error Codes:**

- `401 Unauthorized` - Invalid or missing authentication
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

#### POST /api/library

**Description:** Add track to user's library
**Authentication:** Required (Supabase JWT)
**Request Body:**

```json
{
  "spotify_track_id": "string" // Required, 22 characters
}
```

**Response:**

```json
{
  "spotify_track_id": "string",
  "created_at": "2024-01-01T12:00:00Z"
}
```

**Success Codes:**

- `201 Created` - Track added successfully

**Error Codes:**

- `400 Bad Request` - Invalid spotify_track_id, track already in library, or track is currently blocked
- `401 Unauthorized` - Invalid authentication
- `422 Unprocessable Entity` - Validation errors

#### DELETE /api/library/{spotify_track_id}

**Description:** Remove track from user's library
**Authentication:** Required (Supabase JWT)
**Path Parameters:**

- `spotify_track_id` - Spotify track ID (22 characters)

**Response:**

```json
{
  "message": "Track removed from library successfully"
}
```

**Success Codes:**

- `200 OK` - Track removed successfully

**Error Codes:**

- `400 Bad Request` - Cannot remove last track from library or invalid spotify_track_id
- `401 Unauthorized` - Invalid authentication
- `404 Not Found` - Track not found in user's library

### 2.2 Blocked Tracks

#### GET /api/blocked-tracks

**Description:** Retrieve user's blocked tracks from database
**Authentication:** Required (Supabase JWT)
**Query Parameters:**

- `active_only` (optional, default: true) - Only return non-expired blocks
- `limit` (optional, default: 50, max: 100)
- `offset` (optional, default: 0)

**Response:**

```json
{
  "blocked_tracks": [
    {
      "spotify_track_id": "string",
      "expires_at": "2024-01-01T12:00:00Z|null", // null = permanent
      "created_at": "2024-01-01T12:00:00Z",
      "is_active": true
    }
  ],
  "total_count": 5
}
```

**Success Codes:**

- `200 OK` - Blocked tracks retrieved successfully

**Error Codes:**

- `401 Unauthorized` - Invalid authentication

#### POST /api/blocked-tracks

**Description:** Block a track from recommendations
**Authentication:** Required (Supabase JWT)
**Request Body:**

```json
{
  "spotify_track_id": "string", // Required, 22 characters
  "duration": "1d|7d|permanent" // Required, blocking duration
}
```

**Response:**

```json
{
  "spotify_track_id": "string",
  "expires_at": "2024-01-01T12:00:00Z|null",
  "created_at": "2024-01-01T12:00:00Z",
  "duration": "7d"
}
```

**Success Codes:**

- `201 Created` - Track blocked successfully

**Error Codes:**

- `400 Bad Request` - Invalid spotify_track_id, duration, or track exists in user's library
- `401 Unauthorized` - Invalid authentication
- `409 Conflict` - Track already blocked

#### DELETE /api/blocked-tracks/{spotify_track_id}

**Description:** Remove a track block (unblock)
**Authentication:** Required (Supabase JWT)
**Path Parameters:**

- `spotify_track_id` - Spotify track ID (22 characters)

**Response:**

```json
{
  "message": "Track unblocked successfully"
}
```

**Success Codes:**

- `200 OK` - Track unblocked successfully

**Error Codes:**

- `400 Bad Request` - Invalid spotify_track_id format
- `401 Unauthorized` - Invalid authentication
- `404 Not Found` - Track not blocked by user

## 3. Authentication and Authorization

### Authentication Method

- **Primary:** Supabase Auth with JWT tokens
- **Token Location:** Authorization header: `Bearer <jwt_token>`
- **Token Refresh:** Handled automatically by Supabase SDK

### Authorization Rules

- **Row Level Security (RLS):** Enforced at database level
- **User Isolation:** Users can only access their own library and blocked tracks
- **Resource Ownership:** All operations validate user ownership through `auth.uid()`

### Implementation Details

```typescript
// Middleware validation
const authMiddleware = async (req: Request) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const { data: user, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new UnauthorizedError();
  req.user = user;
};
```

## 4. Validation and Business Logic

### Request Validation

#### Library Tracks

- `spotify_track_id`: Required, exactly 22 characters, alphanumeric
- Uniqueness: Enforced by database constraint `unique_user_track`
- Minimum library size: Cannot delete last track from library
- **Block conflict prevention**: Cannot add tracks that are currently blocked

#### Blocked Tracks

- `spotify_track_id`: Required, exactly 22 characters, alphanumeric
- `duration`: Must be one of ["1d", "7d", "permanent"]
- Uniqueness: Enforced by database constraint `unique_user_blocked_track`
- Expiry validation: `expires_at` must be greater than `created_at` when not null
- **Library conflict prevention**: Cannot block tracks that exist in user's library

### Business Logic Implementation

#### Track Blocking Logic

```typescript
const calculateExpiryDate = (duration: string): Date | null => {
  switch (duration) {
    case "1d":
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    case "permanent":
      return null;
    default:
      throw new ValidationError("Invalid duration");
  }
};
```

#### Business Rules Validation

```typescript
// Before blocking a track, validate business rules:
const blockTrack = async (userId: string, spotifyTrackId: string) => {
  // 1. Check if track exists in user's library
  const libraryTrack = await checkUserLibrary(userId, spotifyTrackId);
  if (libraryTrack) {
    throw new TrackInLibraryError("Cannot block track that exists in your library");
  }

  // 2. Check if track is already blocked
  const existingBlock = await checkExistingBlock(userId, spotifyTrackId);
  if (existingBlock) {
    throw new DuplicateTrackError("Track already blocked");
  }

  // 3. Proceed with blocking
  return createBlock(userId, spotifyTrackId, duration);
};

// Before adding track to library, validate business rules:
const addTrackToLibrary = async (userId: string, spotifyTrackId: string) => {
  // 1. Check if track is currently blocked (active block)
  const blockedTrack = await checkActiveBlock(userId, spotifyTrackId);
  if (blockedTrack) {
    throw new TrackBlockedError("Cannot add blocked track to your library");
  }

  // 2. Check if track already exists in library
  const existingTrack = await checkLibraryDuplicate(userId, spotifyTrackId);
  if (existingTrack) {
    throw new DuplicateTrackError("Track already exists in your library");
  }

  // 3. Proceed with adding to library
  return addToLibrary(userId, spotifyTrackId);
};
```

#### Automatic Cleanup

- Expired blocks are cleaned up automatically via database triggers
- No manual cleanup required in API layer

### Error Handling Standards

- Consistent error response format across all endpoints
- Proper HTTP status codes
- User-friendly error messages
- Detailed logging for debugging (without exposing sensitive data)

#### Common Error Response Format

```json
{
  "error": "Error Type",
  "message": "Human readable message",
  "status": 400
}
```

#### Business Rule Violations (400 Bad Request)

- **Track in Library Conflict**: `"Cannot block track that exists in your library"`
- **Track Blocked Conflict**: `"Cannot add blocked track to your library"`
- **Last Track Protection**: `"Cannot remove last track from library"`
- **Duplicate Track**: `"Track already exists in your library"`

#### Resource Not Found (404 Not Found)

- **Track Not Found**: `"Track not found in user's library"`
- **Block Not Found**: `"Track not blocked by user"`

#### Conflict Errors (409 Conflict)

- **Duplicate Block**: `"Track already blocked"`

### Rate Limiting

- **General API:** 1000 requests per hour per user for all endpoints
