"use client";

import Link from "next/link";
import { useState } from "react";

export const Banner = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log("Search for:", searchQuery);
  };

  return (
    <div className="w-full bg-zinc-900 shadow-md fixed top-0 z-50">
      <div className="max-w-10xl mx-auto px-6 py-2 grid grid-cols-banner">
        {/* Website Name/Logo */}
        <Link href="/" className="text-xl font-bold text-gray-300">
          La Galipette Cendrée - Wiki
        </Link>

        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          className="flex flex-1 items-center justify-center mx-8"
        >
          <div className="relative w-3/5 min-w-96">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher un article..."
              className="text-sm w-full px-2 py-0.5 rounded-lg border bg-zinc-700 border-gray-600 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              🔍
            </button>
          </div>
        </form>

        {/* Profile Picture Placeholder */}
        <div className="flex items-center justify-end">
          <span className="text-gray-500 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            👤
          </span>
        </div>
      </div>
    </div>
  );
};
