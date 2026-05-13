"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { BiDotsVerticalRounded, BiSearch, BiBell } from "react-icons/bi";
import { getUnreadNotificationCount } from "@/services/Notifications/notificationService";
import tallyPRs_Logo from "@/public/tallyPRs_Logo.png";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function loadUnreadCount() {
      try {
        const count = await getUnreadNotificationCount();
        setUnreadCount(count);
      } catch {
        setUnreadCount(0);
      }
    }

    loadUnreadCount();
  }, []);

  return (
    <nav className="border-b border-gray-800 bg-black px-6 py-4 flex items-center justify-between text-white">
      {/* Left: Logo */}
      <Link href="/home" className="text-xl font-bold">
        <img
          src={tallyPRs_Logo.src}
          alt="TallyPRs Logo"
          className="h-12 w-auto"
        />
      </Link>

      {/* Right: Actions */}
      <div className="flex items-center gap-4 relative" ref={menuRef}>
        {/* Search */}
        <Link
          href="/search"
          className="p-2 rounded-full hover:bg-zinc-800 transition"
        >
          <BiSearch size={22} />
        </Link>
        <Link
          href="/notifications"
          className="relative p-2 rounded-full hover:bg-zinc-800 transition"
          aria-label="Notifications"
        >
          <BiBell size={22} />

          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#6f1931] ring-1 ring-black" />
          )}
        </Link>

        {/* 3-dot menu */}
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="p-2 rounded-full hover:bg-zinc-800 transition"
        >
          <BiDotsVerticalRounded size={22} />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute right-0 top-12 w-44 rounded-xl border border-gray-700 bg-zinc-900 shadow-lg overflow-hidden z-50">
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-3 text-sm hover:bg-zinc-800 transition"
            >
              Settings
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
