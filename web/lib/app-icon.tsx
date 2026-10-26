import { ImageResponse } from "next/og";

export function appIcon(size: number, rounded = false) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#18181b",
          color: "#ffffff",
          fontSize: size * 0.5,
          fontWeight: 700,
          borderRadius: rounded ? size * 0.22 : 0,
        }}
      >
        H
      </div>
    ),
    { width: size, height: size },
  );
}
