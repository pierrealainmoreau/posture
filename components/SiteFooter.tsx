"use client";

import { usePathname } from "next/navigation";

const HIDE_ON = ["/login", "/signup"];

export function SiteFooter() {
  const pathname = usePathname();
  if (HIDE_ON.includes(pathname)) return null;

  return (
    <footer className="py-5 text-center text-xs text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-950">
      © 2026{" "}
      <a
        href="https://pamoreau.xyz"
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline underline-offset-2 transition-colors"
      >
        Pierre-Alain Moreau
      </a>
    </footer>
  );
}
