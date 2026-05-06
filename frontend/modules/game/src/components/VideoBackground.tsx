import { useEffect, useRef } from "react";

const VIDEO_SOURCE = "/video_game_background.mp4";
const VIDEO_POSTER = "/game_background_main.png";
const VIDEO_SPEED = 1.6;

interface VideoBackgroundProps {
  overlay: string;
}

export function VideoBackground({ overlay }: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent)) return;

    const video = videoRef.current;
    if (!video) return;

    const applySpeed = () => {
      video.defaultPlaybackRate = VIDEO_SPEED;
      video.playbackRate = VIDEO_SPEED;
    };

    applySpeed();
    video.addEventListener("loadedmetadata", applySpeed);
    video.addEventListener("canplay", applySpeed);

    return () => {
      video.removeEventListener("loadedmetadata", applySpeed);
      video.removeEventListener("canplay", applySpeed);
    };
  }, []);

  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url('${VIDEO_POSTER}')`,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          pointerEvents: "none",
        }}
      />

      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={VIDEO_POSTER}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          pointerEvents: "none",
        }}
      >
        <source src={VIDEO_SOURCE} type="video/mp4" />
      </video>

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: overlay,
          pointerEvents: "none",
        }}
      />
    </>
  );
}
