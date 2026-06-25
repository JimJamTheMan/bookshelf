import Link from "next/link";

const TYPES = [
  { key: "books", label: "Books" },
  { key: "films", label: "Films" },
  { key: "tv", label: "TV" },
  { key: "games", label: "Games" },
  { key: "music", label: "Music" },
  { key: "art", label: "Art" },
];

// Lets you switch which media type you're searching while keeping your query.
export function SearchTabs({ active, q }: { active: string; q: string }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {TYPES.map((t) => (
        <Link
          key={t.key}
          href={`/${t.key}${q ? `?q=${encodeURIComponent(q)}` : ""}`}
          className={
            t.key === active
              ? "rounded-full px-3 py-1 text-sm font-medium text-[#200f0a]"
              : "rounded-full border border-white/15 px-3 py-1 text-sm text-white/70 hover:bg-white/5"
          }
          style={t.key === active ? { background: "#d26a2a" } : undefined}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
