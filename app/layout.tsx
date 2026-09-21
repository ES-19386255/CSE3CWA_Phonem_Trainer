import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Phoneme Builder",
  description: "A classroom activity builder for Speech Pathology teachers.",
};

// This tiny script runs before the page paints, so the saved theme/text
// size cookie is applied immediately instead of flashing the default look.
const THEME_SCRIPT = `
try {
  var cookie = document.cookie;
  if (cookie.indexOf("theme=dark") !== -1) document.documentElement.classList.add("dark-theme");
  if (cookie.indexOf("textSize=large") !== -1) document.documentElement.classList.add("large-text");
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <NavBar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
