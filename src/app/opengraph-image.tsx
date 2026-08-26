import { ImageResponse } from "next/og";

export const alt = "kylerPredictz - Football Predictions & Betting Tips";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#18181b",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 700 }}>kylerPredictz</div>
        <div style={{ fontSize: 32, opacity: 0.75, marginTop: 16 }}>Football Predictions &amp; Betting Tips</div>
      </div>
    ),
    { ...size },
  );
}
