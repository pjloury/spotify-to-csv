# Spotify Playlist to CSV Converter

A web application that converts Spotify playlists to CSV files with detailed track information.

## Features

- Drag and drop Spotify playlist URLs
- Configurable column sets for CSV export
- Detailed track information including audio features and analysis
- Modern, responsive UI

## Setup

1. Install dependencies for all parts of the application:
```bash
npm run install-all
```

2. Create a `.env` file in the `api` directory with your Spotify API credentials:
```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
```

3. Start the development servers:
```bash
npm start
```

This will start both the client and API servers:
- Client: http://localhost:5173
- API: http://localhost:3000

## Development

- Client is built with React + Vite
- API is built with Express
- Uses Tailwind CSS for styling
- Concurrent development servers using `concurrently`

## Available Scripts

- `npm start` - Runs both client and API in development mode
- `npm run client` - Runs only the client
- `npm run api` - Runs only the API
- `npm run install-all` - Installs dependencies for root, client, and API 