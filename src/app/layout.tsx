import type { Metadata } from "next";
import { Fraunces, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "AlphaBrief — Screener quantitatif d'actions",
  description:
    "AlphaBrief score chaque action de 0 à 100 via les fondamentaux, indicateurs techniques et momentum. Identifiez les meilleures opportunités en un coup d'œil.",
  openGraph: {
    title: "AlphaBrief — Screener quantitatif d'actions",
    description:
      "Score 0–100 combinant fondamentaux, technique et momentum. Identifiez les meilleures actions en quelques secondes.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    type: "website",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: { url: "/favicon-180.png", sizes: "180x180", type: "image/png" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${interTight.variable} ${fraunces.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0A0F0C] text-[#F0EBDB]">
        {children}
      </body>
    </html>
  );
}
