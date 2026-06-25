import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { SiteNav } from "./_components/SiteNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Warm, literary serif used for headings and the wordmark.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Bookshelf — your diary for everything you read, watch, play & hear",
  description:
    "Log films, TV, music, books, games and art into one colour-coded diary. Rate, review and share what you love.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let unread = 0;
  let handle: string | null = null;
  let name: string | null = null;
  let avatarUrl: string | null = null;
  if (user) {
    const [{ count }, { data: profile }] = await Promise.all([
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .eq("is_read", false),
      supabase
        .from("profiles")
        .select("handle, display_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle(),
    ]);
    unread = count ?? 0;
    handle = profile?.handle ?? null;
    name = profile?.display_name ?? null;
    avatarUrl = profile?.avatar_url ?? null;
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteNav
          signedIn={!!user}
          unread={unread}
          handle={handle}
          name={name}
          avatarUrl={avatarUrl}
        />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
