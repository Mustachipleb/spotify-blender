import type { Track } from "../types/spotify";
import { TrackCard } from "./TrackCard";

interface TrackGridProps {
  tracks: Track[];
  onAdd?: (trackUri: string, trackName: string) => void;
  showAddButton?: boolean;
}

export function TrackGrid({ tracks, onAdd, showAddButton = false }: TrackGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {tracks.map((track) => (
        <TrackCard
          key={track.id}
          track={track}
          onAdd={onAdd}
          showAddButton={showAddButton}
        />
      ))}
    </div>
  );
}
