import type { Track } from "../types/spotify";

interface TrackCardProps {
  track: Track;
  onAdd?: (trackUri: string, trackName: string) => void;
  showAddButton?: boolean;
  onBlacklist?: (track: Track) => void;
  isBlacklisted?: boolean;
}

export function TrackCard({
  track,
  onAdd,
  showAddButton = false,
  onBlacklist,
  isBlacklisted = false,
}: TrackCardProps) {
  return (
    <div className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
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
        <p className="text-sm text-gray-500 italic truncate mb-2">
          {track.album.name}
        </p>
        <div className="flex gap-2">
          {showAddButton && onAdd && (
            <button
              onClick={() => onAdd(track.uri, track.name)}
              className="px-3 py-1 text-xs bg-[#1DB954] text-white rounded-full font-semibold hover:bg-[#1ed760] transition-colors"
            >
              Add to Playlist
            </button>
          )}
          {onBlacklist && (
            <button
              onClick={() => onBlacklist(track)}
              className={`px-3 py-1 text-xs rounded-full font-semibold transition-colors ${
                isBlacklisted
                  ? "bg-gray-500 text-white hover:bg-gray-600"
                  : "bg-red-500 text-white hover:bg-red-600"
              }`}
            >
              {isBlacklisted ? "Remove from Blacklist" : "Blacklist"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
