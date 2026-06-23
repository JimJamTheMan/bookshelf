// Phrase a log status correctly for each medium (read / watch / listen / play / view).
const VERBS: Record<
  string,
  { planned: string; in_progress: string; completed: string }
> = {
  book: { planned: "Want to read", in_progress: "Reading", completed: "Read" },
  film: { planned: "Want to watch", in_progress: "Watching", completed: "Watched" },
  tv: { planned: "Want to watch", in_progress: "Watching", completed: "Watched" },
  music: { planned: "Want to listen", in_progress: "Listening", completed: "Listened" },
  game: { planned: "Want to play", in_progress: "Playing", completed: "Played" },
  art: { planned: "Want to see", in_progress: "Viewing", completed: "Seen" },
};

export function statusLabel(mediaType: string, status: string): string {
  if (status === "on_hold") return "On hold";
  if (status === "dropped") return "Dropped";
  const v = VERBS[mediaType] ?? VERBS.book;
  return v[status as keyof typeof v] ?? status;
}
