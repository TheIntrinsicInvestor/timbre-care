import type { Metadata } from "next";
import { switzer, mono } from "./fonts";
import SiteFooter from "@/components/SiteFooter";
import "./globals.css";

export const metadata: Metadata = {
  title: "Timbre Care",
  description:
    "A consultation is written up and read back. The next morning an agent calls and asks about exactly what the doctor flagged.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${switzer.variable} ${mono.variable}`}>
      <head><meta name="color-scheme" content="light" /></head>
      <body>
        {/* DIRECTION CONTRACT
            THESIS: the two screens are the argument. This page refuses the
            category's benefit-card grid and shows the elder's surface and the
            caregiver's surface side by side, carrying real recorded content.
            OWN-WORLD: off-white #fcfcfb, near-black ink, one vermilion #cf3016
            on the primary action and flag rules only, Switzer with mono field
            labels set above their values, hairline rules, and daylight
            photography of empty places, never of people.
            STORY: a caregiver learns what her mother would see and what she
            herself would be told, then reaches the console that produced it.
            FIRST VIEWPORT: kicker, the problem in one line, the product in one
            paragraph, and the primary action. The two screens follow as the
            evidence for that claim rather than opening the page.
            FORM: The Two Screens, third of three comps, chosen by Brian over
            The Record Sheet and The Instrument. Seed key 21312fa7.
            FINISH: unreviewed and undocumented is unfinished; this build ends
            with the finish review, the verdict, and DESIGN.md */}
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
