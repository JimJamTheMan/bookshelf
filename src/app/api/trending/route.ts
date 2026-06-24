import { NextResponse, type NextRequest } from "next/server";
import { getTrending } from "@/lib/tmdb";

// Returns a page of trending media (used by the Discover infinite scroll).
export async function GET(request: NextRequest) {
  const pageParam = request.nextUrl.searchParams.get("page");
  const page = Math.max(1, Math.min(100, Number(pageParam) || 1));
  const items = await getTrending(page);
  return NextResponse.json(items);
}
