import type { Track } from "../types/spotify";

interface TrackCardProps {
  track: Track;
  onAdd?: (trackUri: string, trackName: string) => void;
  showAddButton?: boolean;
}

export function TrackCard({ track, onAdd, showAddButton = false }: TrackCardProps) {
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
        <p className="text-sm text-gray-500 italic truncate mb-2">{track.album.name}</p>
        {showAddButton && onAdd && (
          <button
            onClick={() => onAdd(track.uri, track.name)}
            className="w-fit px-3 py-1 text-xs bg-[#1DB954] text-white rounded-full font-semibold hover:bg-[#1ed760] transition-colors"
          >
            Add to Playlist
          </button>
        )}
      </div>
    </div>
  );
}
