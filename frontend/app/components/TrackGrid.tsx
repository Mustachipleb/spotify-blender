import type { Track } from "../types/spotify";
import { TrackCard } from "./TrackCard";

interface TrackGridProps {
  tracks: Track[];
  onAdd?: (trackUri: string, trackName: string) => void;
  showAddButton?: boolean;
  onBlacklist?: (track: Track) => void;
  blacklistedIds?: Set<string>;
}

export function TrackGrid({
  tracks,
  onAdd,
  showAddButton = false,
  onBlacklist,
  blacklistedIds = new Set(),
}: TrackGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {tracks.map((track) => (
        <TrackCard
          key={track.id}
          track={track}
          onAdd={onAdd}
          showAddButton={showAddButton}
          onBlacklist={onBlacklist}
          isBlacklisted={blacklistedIds.has(track.id)}
        />
      ))}
    </div>
  );
}
