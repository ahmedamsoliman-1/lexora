import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { AuthProvider } from "@/features/auth/auth-provider";
import { env } from "@/lib/env";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${env.NEXT_PUBLIC_APP_NAME} — Your prompt workspace`,
    template: `%s · ${env.NEXT_PUBLIC_APP_NAME}`,
  },
  description:
    "A personal workspace for writing, improving, organizing, composing, versioning, and reusing prompts and text.",
  applicationName: env.NEXT_PUBLIC_APP_NAME,
  authors: [{ name: "Lexora" }],
  keywords: [
    "prompts",
    "prompt engineering",
    "writing",
    "grammar",
    "workspace",
    "blocks",
    "templates",
  ],
  metadataBase: (() => {
    try {
      return new URL(env.NEXT_PUBLIC_APP_URL);
    } catch {
      return undefined;
    }
  })(),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0e1b" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetBrainsMono.variable}`}
    >
      <body className="bg-background text-foreground min-h-screen font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
