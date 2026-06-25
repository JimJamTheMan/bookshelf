// Each format has its own natural cover shape: albums/artworks are square,
// game box art is a little taller, books/films/TV are tall posters.
export function coverAspect(mediaType: string): string {
  switch (mediaType) {
    case "music":
    case "art":
      return "aspect-square";
    case "game":
      return "aspect-[3/4]";
    default:
      return "aspect-[2/3]"; // book, film, tv
  }
}

// Upgrade a cover URL to a higher resolution at display time, so even covers
// that were cached at a smaller size render sharply.
export function hiResCover(
  url: string | null | undefined,
): string | null | undefined {
  if (!url) return url;
  return url
    .replace("/t/p/w342/", "/t/p/w500/") // TMDb posters
    .replace("/t/p/w185/", "/t/p/w500/")
    .replace(/-M\.jpg$/, "-L.jpg") // Open Library covers
    .replace("/front-250", "/front-500"); // Cover Art Archive
}

// Append the year in brackets for films & TV (the common convention), e.g.
// "GoodFellas (1990)". Other media keep their plain title.
export function displayTitle(
  title: string,
  year: number | null | undefined,
  mediaType: string,
): string {
  if (year && (mediaType === "film" || mediaType === "tv")) {
    return `${title} (${year})`;
  }
  return title;
}
