import React, { useState, useCallback, useEffect } from 'react';
import { Upload, Loader } from 'lucide-react';

const columnSets = {
  basic: {
    label: 'Basic Info',
    description: 'Track name, artist names, album name',
    fields: ['name', 'artists', 'album'],
    checked: true
  },
  details: {
    label: 'Track Details',
    description: 'Duration, popularity, track number, disc number, ISRC',
    fields: ['duration_ms', 'popularity', 'track_number', 'disc_number', 'isrc'],
    checked: false
  },
  album: {
    label: 'Album Details',
    description: 'Release date, album type, total tracks, label',
    fields: ['album_release_date', 'album_type', 'album_total_tracks', 'album_label'],
    checked: false
  },
  audio: {
    label: 'Audio Features',
    description: 'Danceability, energy, key, tempo, time signature',
    fields: ['danceability', 'energy', 'key', 'tempo', 'time_signature'],
    checked: false
  },
  analysis: {
    label: 'Audio Analysis',
    description: 'Acousticness, instrumentalness, liveness, loudness, speechiness, valence',
    fields: ['acousticness', 'instrumentalness', 'liveness', 'loudness', 'speechiness', 'valence'],
    checked: false
  },
  links: {
    label: 'URLs & IDs',
    description: 'Spotify URL, preview URL, URI, external IDs',
    fields: ['spotify_url', 'preview_url', 'uri', 'external_ids'],
    checked: false
  },
  markets: {
    label: 'Availability',
    description: 'Available markets, explicit content, restrictions',
    fields: ['available_markets', 'explicit', 'restrictions'],
    checked: false
  }
};

const extractPlaylistId = (url) => {
  // Handle both URL formats:
  // https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
  // spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
  try {
    if (url.includes('spotify:playlist:')) {
      return url.split('spotify:playlist:')[1];
    }
    
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const playlistIndex = pathParts.indexOf('playlist');
    if (playlistIndex !== -1 && pathParts[playlistIndex + 1]) {
      // Remove any query parameters
      return pathParts[playlistIndex + 1].split('?')[0];
    }
  } catch (error) {
    console.error('Error parsing playlist URL:', error);
  }
  return null;
};

const fetchPlaylistData = async (playlistId) => {
  const response = await fetch(`/api/playlist/${playlistId}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to fetch playlist data' }));
    throw new Error(errorData.error || 'Failed to fetch playlist data');
  }
  return response.json();
};

const SpotifyConverter = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [playlistData, setPlaylistData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [selectedSets, setSelectedSets] = useState(
    Object.fromEntries(
      Object.entries(columnSets).map(([key, value]) => [key, value.checked])
    )
  );
  const [detailedTracks, setDetailedTracks] = useState({});

  const getColumnClass = (field) => {
    switch (field) {
      case 'name':
        return 'col-name';
      case 'artists':
        return 'col-artists';
      case 'album':
        return 'col-album';
      default:
        return 'col-other';
    }
  };

  const getFriendlyColumnName = (field) => {
    const nameMap = {
      // Basic Info
      name: 'Title',
      artists: 'Artists',
      album: 'Album',
      
      // Track Details
      duration_ms: 'Duration',
      popularity: 'Popularity',
      track_number: 'Track Number',
      disc_number: 'Disc Number',
      isrc: 'ISRC',
      
      // Album Details
      album_release_date: 'Release Date',
      album_type: 'Album Type',
      album_total_tracks: 'Total Tracks',
      album_label: 'Label',
      
      // Audio Features
      danceability: 'Danceability',
      energy: 'Energy',
      key: 'Key',
      tempo: 'Tempo',
      time_signature: 'Time Signature',
      
      // Audio Analysis
      acousticness: 'Acousticness',
      instrumentalness: 'Instrumentalness',
      liveness: 'Liveness',
      loudness: 'Loudness',
      speechiness: 'Speechiness',
      valence: 'Valence',
      
      // URLs & IDs
      spotify_url: 'Spotify URL',
      preview_url: 'Preview URL',
      uri: 'URI',
      external_ids: 'External IDs',
      
      // Availability
      available_markets: 'Available Markets',
      explicit: 'Explicit',
      restrictions: 'Restrictions'
    };
    
    return nameMap[field] || field;
  };

  const PreviewTable = () => {
    if (!playlistData) return null;
  
    const selectedFields = Object.entries(selectedSets)
      .filter(([_, isSelected]) => isSelected)
      .flatMap(([setKey]) => columnSets[setKey].fields);
  
    if (selectedFields.length === 0) {
      return (
        <div className="preview-empty">
          Select data fields to preview your CSV format
        </div>
      );
    }
  
    const previewTracks = playlistData.tracks.items.slice(0, 10);
  
    return (
      <table className="preview-table">
        <thead>
          <tr>
            <th className="col-track-number">#</th>
            {selectedFields.map(field => (
              <th key={field} className={getColumnClass(field)}>{getFriendlyColumnName(field)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {previewTracks.map((item, index) => (
            <tr key={item.track.id}>
              <td className="text-[#A7A7A7]">{index + 1}</td>
              {selectedFields.map(field => (
                <td key={field} className={getColumnClass(field)}>{getFieldValue(item.track, field)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // Add window-level drag and drop handlers
  useEffect(() => {
    const handleWindowDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleWindowDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Only set dragging to false if we're leaving the window
      if (e.clientY <= 0 || e.clientX <= 0 || 
          e.clientY >= window.innerHeight || 
          e.clientX >= window.innerWidth) {
        setIsDragging(false);
      }
    };

    const handleWindowDrop = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      
      const text = e.dataTransfer.getData('text');
      await handlePlaylistUrl(text);
    };

    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []); // Empty dependency array since we don't use any props or state

  const handlePlaylistUrl = async (text) => {
    setError('');
    
    if (!text.includes('spotify.com/playlist')) {
      setError('Please drop a valid Spotify playlist URL');
      return;
    }
    
    const playlistId = extractPlaylistId(text);
    if (!playlistId) {
      setError('Could not extract playlist ID from URL');
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchPlaylistData(playlistId);
      setPlaylistData(data);
      await loadTrackDetails();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTrackDetails = async (trackId) => {
    try {
      console.log(`Starting to fetch details for track ${trackId}`);
      
      const [trackResponse, featuresResponse] = await Promise.all([
        fetch(`/api/track/${trackId}`),
        fetch(`/api/audio-features/${trackId}`)
      ]);

      console.log('Response statuses:', {
        track: trackResponse.status,
        features: featuresResponse.status
      });

      if (!trackResponse.ok) {
        const error = await trackResponse.text();
        console.error('Track fetch failed:', error);
        throw new Error(`Track fetch failed: ${error}`);
      }

      if (!featuresResponse.ok) {
        const error = await featuresResponse.text();
        console.error('Features fetch failed:', error);
        throw new Error(`Features fetch failed: ${error}`);
      }

      const [trackDetails, audioFeatures] = await Promise.all([
        trackResponse.json(),
        featuresResponse.json()
      ]);

      console.log('Raw responses:', {
        trackDetails,
        audioFeatures
      });

      // Merge the track details with audio features
      const mergedData = {
        ...trackDetails,
        // Copy audio features directly from response
        acousticness: audioFeatures.acousticness,
        danceability: audioFeatures.danceability,
        energy: audioFeatures.energy,
        instrumentalness: audioFeatures.instrumentalness,
        key: audioFeatures.key,
        liveness: audioFeatures.liveness,
        loudness: audioFeatures.loudness,
        mode: audioFeatures.mode,
        speechiness: audioFeatures.speechiness,
        tempo: audioFeatures.tempo,
        time_signature: audioFeatures.time_signature,
        valence: audioFeatures.valence
      };

      console.log('Merged data:', mergedData);
      
      // Verify audio features were merged correctly
      if (mergedData.acousticness === undefined) {
        console.warn('Audio features may not have been merged correctly:', {
          originalFeatures: audioFeatures,
          mergedResult: mergedData
        });
      }

      return mergedData;
    } catch (error) {
      console.error(`Error fetching details for track ${trackId}:`, error);
      return null;
    }
  };

  const loadTrackDetails = async () => {
    if (!playlistData) return;

    setIsLoadingDetails(true);
    const details = {};
    const tracks = playlistData.tracks.items;

    // Process tracks in batches of 5 to avoid rate limiting
    for (let i = 0; i < tracks.length; i += 5) {
      const batch = tracks.slice(i, i + 5);
      const batchResults = await Promise.all(
        batch.map(item => fetchTrackDetails(item.track.id))
      );
      batchResults.forEach((result, index) => {
        if (result) {
          details[tracks[i + index].track.id] = result;
        }
      });
    }

    setDetailedTracks(details);
    setIsLoadingDetails(false);
  };

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const text = e.dataTransfer.getData('text');
    await handlePlaylistUrl(text);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleSetToggle = (setKey) => {
    setSelectedSets(prev => ({
      ...prev,
      [setKey]: !prev[setKey]
    }));
  };

  const getFieldValue = (track, field) => {
    const detailedTrack = detailedTracks[track.id] || {};
    
    switch (field) {
      // Basic Info
      case 'name':
        return track.name;
      case 'artists':
        return track.artists.map(a => a.name).join('; ');
      case 'album':
        return track.album.name;
      
      // Track Details
      case 'duration_ms':
        return Math.round(track.duration_ms / 1000) + 's';
      case 'popularity':
        return track.popularity;
      case 'track_number':
        return track.track_number;
      case 'disc_number':
        return track.disc_number;
      case 'isrc':
        return track.external_ids?.isrc || '';
      
      // Album Details
      case 'album_release_date':
        return track.album.release_date;
      case 'album_type':
        return track.album.album_type;
      case 'album_total_tracks':
        return track.album.total_tracks;
      case 'album_label':
        return detailedTrack.album?.label || '';
      
      // Audio Features
      case 'danceability':
        return detailedTrack.danceability?.toFixed(2) || '';
      case 'energy':
        return detailedTrack.energy?.toFixed(2) || '';
      case 'key':
        const keys = ['C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B'];
        return detailedTrack.key >= 0 ? keys[detailedTrack.key] : '';
      case 'tempo':
        return detailedTrack.tempo?.toFixed(0) || '';
      case 'time_signature':
        return detailedTrack.time_signature ? `${detailedTrack.time_signature}/4` : '';
      
      // Audio Analysis
      case 'acousticness':
        return detailedTrack.acousticness?.toFixed(2) || '';
      case 'instrumentalness':
        return detailedTrack.instrumentalness?.toFixed(2) || '';
      case 'liveness':
        return detailedTrack.liveness?.toFixed(2) || '';
      case 'loudness':
        return detailedTrack.loudness?.toFixed(1) + ' dB' || '';
      case 'speechiness':
        return detailedTrack.speechiness?.toFixed(2) || '';
      case 'valence':
        return detailedTrack.valence?.toFixed(2) || '';
      
      // URLs & IDs
      case 'spotify_url':
        return track.external_urls.spotify || '';
      case 'preview_url':
        return track.preview_url || '';
      case 'uri':
        return track.uri || '';
      case 'external_ids':
        return Object.entries(track.external_ids || {})
          .map(([key, value]) => `${key}:${value}`)
          .join('; ');
      
      // Availability
      case 'available_markets':
        return (track.available_markets || []).join('; ');
      case 'explicit':
        return track.explicit ? 'Yes' : 'No';
      case 'restrictions':
        return track.restrictions ? JSON.stringify(track.restrictions) : '';
      
      default:
        return '';
    }
  };

  const generateCSV = () => {
    if (!playlistData) return;

    // Get all selected fields
    const selectedFields = Object.entries(selectedSets)
      .filter(([_, isSelected]) => isSelected)
      .flatMap(([setKey]) => columnSets[setKey].fields);

    // Generate headers
    const headers = selectedFields.join(',');

    // Generate rows
    const rows = playlistData.tracks.items.map(track => {
      return selectedFields.map(field => {
        const value = getFieldValue(track.track, field);
        return formatCSVValue(value);
      }).join(',');
    });

    // Combine headers and rows
    const csvContent = [headers, ...rows].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${playlistData.name}_playlist.csv`;
    link.click();
  };

  const formatCSVValue = (value) => {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
  };

  return (
    <div className="app-container">
      <div className="header-section">
        <div className="header-titles">
          <h1 className="page-title">
            Spotify to CSV
          </h1>
          <p className="page-subtitle">
            Export your playlists with the data you need
          </p>
        </div>

        {!playlistData && (
          <div 
            className={`drop-zone ${isDragging ? 'dragging' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {isLoading ? (
              <div className="loading-indicator">
                <div className="flex flex-col items-center">
                  <Loader className="w-6 h-6 animate-spin text-[#1DB954] mb-1" />
                  <p className="text-[#A7A7A7] text-xs">Loading playlist...</p>
                </div>
              </div>
            ) : (
              <div className="drop-zone-empty">
                <h2 className="drop-zone-text">Drop a Playlist Here</h2>
                <p className="text-[#A7A7A7] text-xs">
                  Drag the URL from Spotify's share button
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {playlistData && (
        <>
          {isLoadingDetails && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 flex items-center bg-[#2A2A2A] rounded p-2 shadow-xl">
              <Loader className="w-3 h-3 animate-spin text-[#1DB954] mr-2" />
              <span className="text-[#A7A7A7] text-xs">Loading track details...</span>
            </div>
          )}

          <div className="data-section">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">Choose Your Data</h3>
              <div className="flex items-center space-x-3">
                <div className="text-[#A7A7A7] text-xs">
                  {playlistData.name} • {playlistData.tracks.total} tracks
                </div>
                <button
                  onClick={generateCSV}
                  disabled={!Object.values(selectedSets).some(Boolean) || isLoadingDetails}
                  className="spotify-button text-xs py-1.5 px-4"
                >
                  {isLoadingDetails ? (
                    <>
                      <Loader className="w-3 h-3 animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    'Download CSV'
                  )}
                </button>
              </div>
            </div>

            <div className="checkbox-grid">
              {Object.entries(columnSets).map(([key, set]) => (
                <label key={key} className="checkbox-spotify">
                  <input
                    type="checkbox"
                    checked={selectedSets[key]}
                    onChange={() => handleSetToggle(key)}
                  />
                  <div className="checkbox-custom"></div>
                  <div className="checkbox-label">
                    <div className="checkbox-title">{set.label}</div>
                    <div className="checkbox-description">{set.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="preview-section">
            <PreviewTable />
          </div>
        </>
      )}

      {error && (
        <div className="error-message text-xs">
          {error}
        </div>
      )}
    </div>
  );
};

export default SpotifyConverter;