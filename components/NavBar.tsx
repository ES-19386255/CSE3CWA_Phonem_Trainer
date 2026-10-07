"use client";

import Link from "next/link";
import { useState } from "react";

const PRIMARY_LINKS = [
  { href: "/", label: "Home" },
  { href: "/wordle", label: "Wordle" },
  { href: "/wordsearch", label: "Word Search" },
  { href: "/activities", label: "Manage" },
];

const MENU_LINKS = [
  { href: "/about", label: "About" },
  { href: "/settings", label: "Settings" },
];

// site header
export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);

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
          
          <div className="relative">
            <button
              type="button"
              className="rounded-md p-2 text-lg leading-none hover:bg-[var(--bg)]"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              ⋮
            </button>

            {menuOpen && (
              <ul className="absolute right-0 mt-1 w-40 rounded-md border border-[var(--border)] bg-[var(--surface)] py-1 shadow-md">
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
