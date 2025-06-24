# Mock Mode Documentation

## Overview

Mock mode allows you to develop and test the application without making real API calls to Spotify and OpenAI. This is useful for:

- Local development without API keys
- Avoiding API rate limits during development
- Testing with consistent, predictable data
- Working offline

## Configuration

To enable mock mode, set the environment variable:

```bash
ENABLE_MOCK_MODE=true
```

## What gets mocked

### Spotify API

- `getTrackDetails()` - Returns realistic metal track data
- `getMultipleTrackDetails()` - Returns batch track data
- `searchTrackByNameAndArtist()` - Returns simulated search results

### OpenAI API

- `generateRecommendations()` - Returns pre-written AI recommendations
- `generateArtistBio()` - Returns realistic artist biographies

## Mock Data

### Track Database

The mock system includes data for popular metal tracks:

- Metallica - Master of Puppets
- Black Sabbath - Paranoid, Iron Man, War Pigs
- Led Zeppelin - Stairway to Heaven
- Judas Priest - Breaking the Law
- Slayer - Angel of Death
- And more...

### AI Recommendations

Pre-written recommendation reasoning that mimics real AI output:

- Based on musical characteristics
- Includes confidence scores
- Contextual explanations

### Artist Biographies

Comprehensive biographies focusing on metal music contributions for major artists.

## Fallback Behavior

If a track/artist isn't in the mock database, the system will:

- Generate reasonable fallback data
- Create valid Spotify-like IDs
- Provide generic but appropriate content

## Usage Example

```bash
# In your terminal
export ENABLE_MOCK_MODE=true

# Or in your .env file
ENABLE_MOCK_MODE=true

# Start the application
npm run dev
```

## Mock vs Real API

| Feature     | Mock Mode            | Real API                       |
| ----------- | -------------------- | ------------------------------ |
| Setup       | No API keys required | Requires Spotify + OpenAI keys |
| Speed       | Instant responses    | Network dependent              |
| Data        | Consistent, curated  | Dynamic, real-time             |
| Rate Limits | None                 | API provider limits            |
| Costs       | Free                 | Usage-based billing            |

## Development Workflow

1. **Initial Development**: Use mock mode for UI/UX work
2. **Integration Testing**: Switch to real APIs for final testing
3. **Production**: Always use real APIs (mock mode disabled)

## Console Logging

Mock mode includes detailed console logging:

- `spotify_get_track_details_mock`
- `openai_generate_recommendations_mock`
- `openai_generate_artist_bio_mock`

This helps identify when mock data is being used.
