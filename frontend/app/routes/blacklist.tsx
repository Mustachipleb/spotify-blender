import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { Track } from "../types/spotify";
import { TrackGrid } from "../components/TrackGrid";
import { Section } from "../components/Section";

export default function BlacklistPage() {
  const [blacklist, setBlacklist] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchBlacklist = async () => {
    const token = sessionStorage.getItem("access_token");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4010";
      const response = await fetch(`${backendUrl}/blacklist`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        sessionStorage.clear();
        navigate("/");
        return;
      }

      if (!response.ok) throw new Error("Failed to fetch blacklist");

      const data = await response.json();
      setBlacklist(data.map((t: any) => ({
        id: t.spotifyId,
        uri: t.uri,
        name: t.name,
        artists: t.artists ? t.artists.split(", ").map((name: string) => ({ name })) : [],
        album: {
          name: t.albumName,
          images: t.albumImageUrl ? [{ url: t.albumImageUrl }] : [],
        },
        external_urls: { spotify: t.externalUrl || "" },
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlacklist();
  }, [navigate]);

  const removeFromBlacklist = async (track: Track) => {
    const token = sessionStorage.getItem("access_token");
    if (!token) return;

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4010";
      const response = await fetch(`${backendUrl}/blacklist/${track.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to remove from blacklist");
      
      // Refresh local state
      setBlacklist(prev => prev.filter(t => t.id !== track.id));
    } catch (err) {
      console.error(err);
      alert("Failed to remove track from blacklist");
    }
  };

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Your Blacklist</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Songs in this list will be excluded from the automated "Blender" playlist.
      </p>

      {loading && <p>Loading your blacklist...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {!loading && !error && (
        <Section title="Blacklisted Songs">
          {blacklist.length === 0 ? (
            <p className="text-gray-500 italic">Your blacklist is empty.</p>
          ) : (
            <TrackGrid 
              tracks={blacklist} 
              onBlacklist={removeFromBlacklist} 
              blacklistedIds={new Set(blacklist.map(t => t.id))}
            />
          )}
        </Section>
      )}
    </main>
  );
}
