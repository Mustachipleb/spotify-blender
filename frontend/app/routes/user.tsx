import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

interface Track {
  id: string;
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    if (!token) {
      navigate("/");
      return;
    }
    setAccessToken(token);

    const fetchTopTracks = async () => {
      try {
        const response = await fetch("https://api.spotify.com/v1/me/top/tracks", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            sessionStorage.clear();
            navigate("/");
            return;
          }
          throw new Error("Failed to fetch top tracks");
        }

        const data = await response.json();
        setTopTracks(data.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchTopTracks();
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
  };

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Top Tracks</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Log out
        </button>
      </div>

      {loading && <p>Loading your top tracks...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {!loading && !error && (
        <div className="grid gap-6 md:grid-cols-2">
          {topTracks.map((track) => (
            <div key={track.id} className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <img
                src={track.album.images[0]?.url}
                alt={track.album.name}
                className="w-20 h-20 rounded shadow"
              />
              <div className="flex flex-col justify-center">
                <a
                  href={track.external_urls.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-lg hover:underline text-blue-600 dark:text-blue-400"
                >
                  {track.name}
                </a>
                <p className="text-gray-600 dark:text-gray-400">
                  {track.artists.map((a) => a.name).join(", ")}
                </p>
                <p className="text-sm text-gray-500 italic">{track.album.name}</p>
              </div>
            </div>
          ))}
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
