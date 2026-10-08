"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const PRIMARY_LINKS = [
  { href: "/", label: "Home" },
  { href: "/wordle", label: "Wordle" },
  { href: "/wordsearch", label: "Word Search" },
  { href: "/activities", label: "Manage" },
  { href: "/dashboard", label: "Dashboard" },
];

const MENU_LINKS = [
  { href: "/about", label: "About" },
  { href: "/settings", label: "Settings" },
];

// The site header: shows the project title, the main page links, and a
// kebab menu (always visible, not just on mobile) for About and Settings.
export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // While the menu is open: Escape closes it (and puts focus back on the
  // button), and so does clicking anywhere outside it.
  useEffect(() => {
    if (!menuOpen) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        buttonRef.current?.focus();
      }
    }
    function handleClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [menuOpen]);

  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-xl font-bold text-[var(--primary)]">
          Phoneme Builder
        </Link>

        <div className="flex items-center gap-4">
          <ul className="flex flex-wrap gap-4">
            {PRIMARY_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm font-medium hover:text-[var(--primary)]">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Kebab menu button: stays visible on every screen size, and
              holds the two secondary pages (About and Settings). */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              ref={buttonRef}
              className="rounded-md p-2 text-lg leading-none hover:bg-[var(--bg)]"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              ⋮
            </button>

            {menuOpen && (
              <ul id="site-menu" className="absolute right-0 z-10 mt-1 w-40 rounded-md border border-[var(--border)] bg-[var(--surface)] py-1 shadow-md">
                {MENU_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="block px-3 py-2 text-sm font-medium hover:bg-[var(--bg)]"
                      onClick={() => setMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
