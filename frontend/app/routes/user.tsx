import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

interface Track {
  id: string;
  uri: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  external_urls: { spotify: string };
}

export default function UserPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [playlistTracks, setPlaylistTracks] = useState<Track[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const PLAYLIST_ID = "4oqtLpfSdiagaoix6U94qm"; //"1pJO26tWnsZRAfVl1hT5Dp";

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

        const [topTracksRes, playlistRes] = await Promise.all([
          fetch("https://api.spotify.com/v1/me/top/tracks", { headers }),
          fetch(`https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks`, { headers }),
        ]);

        if (topTracksRes.status === 401 || playlistRes.status === 401) {
          sessionStorage.clear();
          navigate("/");
          return;
        }

        if (!topTracksRes.ok) throw new Error("Failed to fetch top tracks");
        if (!playlistRes.ok) throw new Error("Failed to fetch playlist tracks");

        const topTracksData = await topTracksRes.json();
        const playlistData = await playlistRes.json();

        setTopTracks(topTracksData.items);
        setPlaylistTracks(playlistData.items.map((item: any) => item.track));
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

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
  };

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Spotify Blender</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Log out
        </button>
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
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Your Top Tracks</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {topTracks.map((track) => (
                <div key={track.id} className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                  <img
                    src={track.album.images[0]?.url}
                    alt={track.album.name}
                    className="w-20 h-20 rounded shadow"
                  />
                  <div className="flex flex-col flex-1 justify-center min-w-0">
                    <a
                      href={track.external_urls.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-lg hover:underline text-blue-600 dark:text-blue-400 truncate"
                    >
                      {track.name}
                    </a>
                    <p className="text-gray-600 dark:text-gray-400 truncate">
                      {track.artists.map((a) => a.name).join(", ")}
                    </p>
                    <p className="text-sm text-gray-500 italic truncate mb-2">{track.album.name}</p>
                    <button
                      onClick={() => addToPlaylist(track.uri, track.name)}
                      className="w-fit px-3 py-1 text-xs bg-[#1DB954] text-white rounded-full font-semibold hover:bg-[#1ed760] transition-colors"
                    >
                      Add to Playlist
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200 border-t pt-8">Current Playlist Content</h2>
            {playlistTracks.length === 0 ? (
              <p className="text-gray-500 italic">The playlist is currently empty.</p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {playlistTracks.map((track, index) => (
                  <div key={`${track.id}-${index}`} className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                    <img
                      src={track.album.images[0]?.url}
                      alt={track.album.name}
                      className="w-20 h-20 rounded shadow"
                    />
                    <div className="flex flex-col flex-1 justify-center min-w-0">
                      <a
                        href={track.external_urls.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-lg hover:underline text-blue-600 dark:text-blue-400 truncate"
                      >
                        {track.name}
                      </a>
                      <p className="text-gray-600 dark:text-gray-400 truncate">
                        {track.artists.map((a) => a.name).join(", ")}
                      </p>
                      <p className="text-sm text-gray-500 italic truncate">{track.album.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
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
