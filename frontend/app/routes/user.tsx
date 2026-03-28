import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { Track } from "../types/spotify";
import { TrackGrid } from "../components/TrackGrid";
import { Section } from "../components/Section";

export default function UserPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [playlistTracks, setPlaylistTracks] = useState<Track[]>([]);
  const [blacklistedIds, setBlacklistedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const PLAYLIST_ID = "1pJO26tWnsZRAfVl1hT5Dp";

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    if (!token) {
      navigate("/");
      return;
    }
    setAccessToken(token);

    const fetchData = async () => {
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4010";

        const [topTracksRes, playlistRes, blacklistRes] = await Promise.all([
          fetch("https://api.spotify.com/v1/me/top/tracks", { headers }),
          fetch(`https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks`, { headers }),
          fetch(`${backendUrl}/blacklist`, { headers }),
        ]);

        if (topTracksRes.status === 401 || playlistRes.status === 401 || blacklistRes.status === 401) {
          sessionStorage.clear();
          navigate("/");
          return;
        }

        if (!topTracksRes.ok) throw new Error("Failed to fetch top tracks");
        if (!playlistRes.ok) throw new Error("Failed to fetch playlist tracks");
        if (!blacklistRes.ok) throw new Error("Failed to fetch blacklist");

        const topTracksData = await topTracksRes.json();
        const playlistData = await playlistRes.json();
        const blacklistData = await blacklistRes.json();

        setTopTracks(topTracksData.items);
        setPlaylistTracks(playlistData.items.map((item: any) => item.track));
        setBlacklistedIds(new Set(blacklistData.map((t: any) => t.spotifyId)));
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const addToPlaylist = async (trackUri: string, trackName: string) => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/items`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris: [trackUri],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to add track to playlist");
      }

      setStatusMessage(`Successfully added "${trackName}" to the playlist!`);
      
      // Refresh playlist tracks
      const playlistRes = await fetch(`https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (playlistRes.ok) {
        const playlistData = await playlistRes.json();
        setPlaylistTracks(playlistData.items.map((item: any) => item.track));
      }

      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setStatusMessage(err instanceof Error ? `Error: ${err.message}` : "Failed to add track to playlist");
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const toggleBlacklist = async (track: Track) => {
    const token = sessionStorage.getItem("access_token");
    if (!token) return;

    const isBlacklisted = blacklistedIds.has(track.id);
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4010";

    try {
      if (isBlacklisted) {
        const response = await fetch(`${backendUrl}/blacklist/${track.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to remove from blacklist");
        setBlacklistedIds(prev => {
          const next = new Set(prev);
          next.delete(track.id);
          return next;
        });
      } else {
        const response = await fetch(`${backendUrl}/blacklist`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            spotifyId: track.id,
            name: track.name,
            uri: track.uri,
            artists: track.artists.map(a => a.name).join(", "),
            albumName: track.album.name,
            albumImageUrl: track.album.images[0]?.url,
            externalUrl: track.external_urls.spotify,
          }),
        });
        if (!response.ok) throw new Error("Failed to add to blacklist");
        setBlacklistedIds(prev => new Set(prev).add(track.id));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update blacklist");
    }
  };

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Spotify Blender</h1>
      </div>

      {statusMessage && (
        <div className={`mb-4 p-4 rounded ${statusMessage.startsWith("Error") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {statusMessage}
        </div>
      )}

      {loading && <p>Loading your music data...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {!loading && !error && (
        <div className="space-y-12">
          <Section title="Your Top Tracks">
            <TrackGrid 
              tracks={topTracks} 
              onAdd={addToPlaylist} 
              showAddButton 
              onBlacklist={toggleBlacklist}
              blacklistedIds={blacklistedIds}
            />
          </Section>

          <Section title="Current Playlist Content" titleClassName="border-t pt-8">
            {playlistTracks.length === 0 ? (
              <p className="text-gray-500 italic">The playlist is currently empty.</p>
            ) : (
              <TrackGrid 
                tracks={playlistTracks} 
                onBlacklist={toggleBlacklist}
                blacklistedIds={blacklistedIds}
              />
            )}
          </Section>
        </div>
      )}

      <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
        <h2 className="font-semibold mb-2">Debug Info (Access Token):</h2>
        <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg break-all">
          <code className="text-xs text-gray-600 dark:text-gray-400">{accessToken}</code>
        </div>
      </div>
    </main>
  );
}
