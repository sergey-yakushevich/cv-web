import { ImageResponse } from "next/og";

/*
 * A neutral site card. This used to render one person's name, photo and about
 * line — a leftover from when the site was a single CV. Every page shares this
 * image, so it must not show anyone's data.
 */
export const runtime = "edge";

export const alt = "buildcv — Free CV Builder";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "white",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ fontSize: 88, fontWeight: 700, color: "#333333" }}>
        buildcv
      </div>
      <div
        style={{
          fontSize: 32,
          color: "#677184",
          maxWidth: 760,
          marginTop: 24,
          lineHeight: 1.4,
        }}
      >
        A free CV builder — no sign-up. Edit in place, keep versions, download a
        PDF that résumé parsers can actually read.
      </div>
      <div
        style={{
          marginTop: 48,
          fontSize: 24,
          color: "#3280ff",
          padding: "12px 32px",
          border: "2px solid #3280ff",
          borderRadius: 9999,
        }}
      >
        buildcv.cc
      </div>
    </div>,
    {
      ...size,
    }
  );
}
