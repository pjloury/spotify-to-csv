// src/App.jsx
import React from 'react';
import SpotifyConverter from './components/SpotifyConverter';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <SpotifyConverter />
      </div>
    </div>
  );
}

export default App;