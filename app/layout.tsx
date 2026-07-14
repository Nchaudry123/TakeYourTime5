import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Take Your Time — Persona 5 Royal Calendar",
  description: "A live, searchable daily planner for an optimized Persona 5 Royal playthrough.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Take Your Time — Persona 5 Royal Calendar",
    description: "Plan every day, track every Confidant, and protect the Third Semester.",
    type: "website",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "Take Your Time Persona 5 Royal calendar" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Take Your Time — Persona 5 Royal Calendar",
    description: "Plan every day, track every Confidant, and protect the Third Semester.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
