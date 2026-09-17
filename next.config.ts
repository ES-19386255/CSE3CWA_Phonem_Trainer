import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pins the project root to this folder, so Turbopack doesn't get
  // confused if a lockfile happens to exist somewhere above it (e.g. a
  // shared parent folder holding multiple unrelated projects).
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
