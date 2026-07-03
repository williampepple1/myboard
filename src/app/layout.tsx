import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MyBoard | Planning & Roadmaps",
  description: "A modern project management and planning tool with Kanban boards, Spaces, and Roadmaps.",
  openGraph: {
    title: "MyBoard | Planning & Roadmaps",
    description: "A modern project management and planning tool with Kanban boards, Spaces, and Roadmaps.",
    siteName: "MyBoard",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyBoard | Planning & Roadmaps",
    description: "A modern project management and planning tool with Kanban boards, Spaces, and Roadmaps.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
