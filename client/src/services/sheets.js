// src/services/sheets.js

class GoogleSheetsService {
    async createSpreadsheet(playlistData) {
      try {
        // This would be your backend endpoint
        const response = await fetch('/api/create-spreadsheet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            playlistName: playlistData.name,
            tracks: playlistData.tracks.items
          })
        });
  
        if (!response.ok) {
          throw new Error('Failed to create spreadsheet');
        }
  
        const data = await response.json();
        return data.spreadsheetUrl; // URL of the created spreadsheet
      } catch (error) {
        console.error('Error creating spreadsheet:', error);
        throw error;
      }
    }
  }
  
  export default new GoogleSheetsService();