"use client";

import Link from "next/link";
import { SearchBar } from "../SearchBar/SearchBar";
import { useRef } from "react";
import { useTooltip } from "@/hooks/useTooltip";

export const Banner = () => {
  const userRef = useRef(null);
  const userTooltip = useTooltip({
    targetRef: userRef,
    content: "L'autentification n'est pas (encore) implémentée...",
    delay: 200, // optional, defaults to 200ms
    offset: 8, // optional, defaults to 8px
  });

  return (
    <div className="w-full bg-zinc-900 shadow-md fixed top-0 z-50">
      <div className="max-w-10xl mx-auto px-6 py-2 grid grid-cols-banner">
        {/* Website Name/Logo */}
        <Link href="/" className="text-xl font-bold text-gray-300">
          La Galipette Cendrée - Wiki
        </Link>

        {/* Search Bar */}
        <div className="flex flex-1 items-center justify-center mx-8">
          <SearchBar />
        </div>

        {/* Profile Picture Placeholder */}
        <div className="flex items-center justify-end">
          <span
            className="text-gray-500 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
            ref={userRef}
          >
            👤
          </span>
        </div>
      </div>
      {userTooltip}
    </div>
  );
};
