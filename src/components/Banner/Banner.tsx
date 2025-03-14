"use client";

import Link from "next/link";
import { SearchBar } from "../SearchBar/SearchBar";
import { useRef } from "react";
import { useTooltip } from "@/hooks/useTooltip";
import { ThemeToggle } from "../ui/ThemeToggle";

export const Banner = () => {
  const userRef = useRef(null);
  const userTooltip = useTooltip({
    targetRef: userRef,
    content: "L'autentification n'est pas (encore) implémentée...",
    delay: 200, // optional, defaults to 200ms
    offset: 8, // optional, defaults to 8px
  });

  return (
    <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        {/* Website Name/Logo */}
        <Link href="/" className="text-xl font-bold text-gray-300">
          La Galipette Cendrée - Wiki
        </Link>

        {/* Search Bar */}
        <div className="flex flex-1 items-center justify-center mx-8">
          <SearchBar />
        </div>

        {/* Theme Toggle and Profile */}
        <div className="flex items-center justify-end gap-4">
          <ThemeToggle />
          <span
            className="text-gray-500 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
            ref={userRef}
          >
            👤
          </span>
        </div>
      </div>
      {userTooltip}
    </header>
  );
};
