import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";

// Self-hosted so the production build makes no network request for type.
export const switzer = localFont({
  src: [
    { path: "../../public/fonts/switzer-400.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/switzer-500.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/switzer-600.woff2", weight: "600", style: "normal" },
    { path: "../../public/fonts/switzer-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});

// next/font/google downloads and self-hosts at build time; no runtime CDN call.
export const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});
