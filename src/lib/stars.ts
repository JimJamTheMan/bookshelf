// Ratings are stored on a 0–10 scale (half-star granularity); 10 = 5 stars.
// Render a stored rating as ★/½ out of 5.
export function starsFromRating(rating: number): string {
  const full = Math.floor(rating / 2);
  const half = rating % 2 === 1;
  return "★".repeat(full) + (half ? "½" : "");
}

// Options for a rating <select>: value 1–10, labelled in stars.
export const RATING_OPTIONS: { value: number; label: string }[] = Array.from(
  { length: 10 },
  (_, i) => {
    const v = i + 1;
    return { value: v, label: starsFromRating(v) };
  },
);
