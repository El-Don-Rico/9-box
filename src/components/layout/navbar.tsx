"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/employees", label: "Employees" },
  { href: "/assessments", label: "Assessments" },
  { href: "/nine-box", label: "9-Box Grid" },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/dashboard"
              className="text-lg font-bold text-blue-600"
            >
              9-Box
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname.startsWith(link.href)
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {session?.user?.name}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              Sign Out
            </button>
          </div>

          <button
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "block px-3 py-2 rounded-lg text-sm font-medium",
                  pathname.startsWith(link.href)
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-gray-100 pt-2 mt-2 px-3">
              <p className="text-sm text-gray-600 mb-2">
                {session?.user?.name}
              </p>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-sm text-red-600 font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
