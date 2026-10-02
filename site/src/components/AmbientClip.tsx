"use client";

import { useEffect, useState } from "react";

/**
 * One ambient clip, or its poster.
 *
 * `still` starts true, so the server-rendered HTML is the poster and that is
 * what a no-JS visitor keeps, the same default /demo's Walkthrough takes with
 * `reduced`. The effect only ever turns motion ON, and only when the visitor
 * has not asked for less of it, so a reduced-motion visitor never has a video
 * element on the page and never requests the mp4 at all.
 *
 * The poster is extracted from the clip's own first frame. A poster generated
 * separately, however close, shows as a jump the moment the video starts.
 */
export default function AmbientClip({
  src, poster, alt, className = "",
}: {
  src: string; poster: string; alt: string; className?: string;
}) {
  const [still, setStill] = useState(true);

  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      setStill(false);
  }, []);

  if (still)
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={`cc-clip ${className}`} src={poster} alt={alt} />;

  return (
    <video
      className={`cc-clip ${className}`}
      src={src} poster={poster} aria-label={alt}
      muted loop playsInline autoPlay preload="metadata"
    />
  );
}
