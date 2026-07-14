import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from '@/lib/theme';
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
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Myboard",
  },
};

export const viewport: Viewport = {
  themeColor: "var(--primary-hover)",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('myboard-theme');
                if (theme) {
                  var parsed = JSON.parse(theme);
                  if (parsed.state) {
                    document.documentElement.style.setProperty('--primary', parsed.state.primary);
                    document.documentElement.style.setProperty('--primary-hover', parsed.state.primaryHover);
                  }
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
