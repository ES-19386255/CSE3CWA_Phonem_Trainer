"use client";

import { usePageTimer } from "@/lib/usePageTimer";

// Draws nothing. It just runs the page timer hook on every page, because
// it sits once in the layout.
export default function PageTimer() {
  usePageTimer();
  return null;
}
