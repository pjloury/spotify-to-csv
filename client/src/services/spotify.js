// src/services/spotify.js

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('Missing Spotify credentials. Please check your .env file.');
  }

class SpotifyService {
  constructor() {
    this.accessToken = null;
    this.tokenExpirationTime = null;
  }

  async getAccessToken() {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpirationTime > Date.now()) {
      return this.accessToken;
    }

    // Get new token
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET)
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      throw new Error('Failed to get Spotify access token');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpirationTime = Date.now() + (data.expires_in * 1000);
    return this.accessToken;
  }

  async getPlaylist(playlistId) {
    const token = await this.getAccessToken();
    
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch playlist');
    }

    const data = await response.json();
    
    // Transform the response to include only what we need
    return {
      name: data.name,
      description: data.description,
      tracks: {
        total: data.tracks.total,
        items: data.tracks.items.map(item => ({
          name: item.track.name,
          artists: item.track.artists.map(artist => artist.name).join(', '),
          album: item.track.album.name,
          duration_ms: item.track.duration_ms,
          explicit: item.track.explicit,
          popularity: item.track.popularity,
          preview_url: item.track.preview_url
        }))
      }
    };
  }
}

export default new SpotifyService();