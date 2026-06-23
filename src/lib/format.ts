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
