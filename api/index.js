// api/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Add this near the top after app initialization
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Spotify API configuration
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';
let spotifyToken = null;
let tokenExpirationTime = null;

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url, options, retries = 3, baseDelay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        // Get retry-after header or use exponential backoff
        const retryAfter = response.headers.get('retry-after') || Math.pow(2, i) * baseDelay;
        console.log(`Rate limited. Waiting ${retryAfter}ms before retry ${i + 1}/${retries}`);
        await delay(retryAfter);
        continue;
      }
      
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      const waitTime = Math.pow(2, i) * baseDelay;
      console.log(`Request failed. Waiting ${waitTime}ms before retry ${i + 1}/${retries}`);
      await delay(waitTime);
    }
  }
}

// Function to get a new Spotify access token
async function getSpotifyToken() {
  const now = Date.now();
  if (spotifyToken && tokenExpirationTime && now < tokenExpirationTime) {
    return spotifyToken;
  }

  const auth = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials'
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('Token error response:', data);
    throw new Error('Failed to get Spotify access token');
  }

  spotifyToken = data.access_token;
  tokenExpirationTime = now + (data.expires_in * 1000);
  return spotifyToken;
}

// Middleware to ensure we have a valid Spotify token
async function ensureSpotifyToken(req, res, next) {
  try {
    const token = await getSpotifyToken();
    req.spotifyToken = token;
    next();
  } catch (error) {
    console.error('Token error:', error);
    res.status(500).json({ error: 'Failed to authenticate with Spotify' });
  }
}

// Get playlist details
app.get('/api/playlist/:id', ensureSpotifyToken, async (req, res) => {
  try {
    const response = await fetch(
      `${SPOTIFY_API_URL}/playlists/${req.params.id}`, {
        headers: {
          Authorization: `Bearer ${req.spotifyToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch playlist from Spotify');
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Playlist fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get track details
app.get('/api/track/:id', ensureSpotifyToken, async (req, res) => {
  try {
    const response = await fetchWithRetry(
      `${SPOTIFY_API_URL}/tracks/${req.params.id}`,
      {
        headers: {
          Authorization: `Bearer ${req.spotifyToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch track from Spotify');
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Track fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get audio features for a track
app.get('/api/audio-features/:id', ensureSpotifyToken, async (req, res) => {
  try {
    const trackId = req.params.id;
    console.log('\n=== AUDIO FEATURES REQUEST ===');
    console.log('Track ID:', trackId);
    
    const url = `${SPOTIFY_API_URL}/audio-features/${trackId}`;
    console.log('Request URL:', url);
    
    const response = await fetchWithRetry(
      url,
      {
        headers: {
          Authorization: `Bearer ${req.spotifyToken}`,
        },
      }
    );

    const data = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('Error response from Spotify:', data);
      throw new Error('Failed to fetch audio features from Spotify');
    }

    res.json(data);
  } catch (error) {
    console.error('Audio features fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

app.get('/api/test', (req, res) => {
  console.log('Test endpoint hit!');
  res.json({ message: 'Test successful' });
});

app.listen(port, () => {
  console.log(`API server running on port ${port}`);
});