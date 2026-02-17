"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignOutButton, UserButton } from "@clerk/nextjs";

export function Navbar() {
  return (
    <header className="border-b border-brown-200/80 bg-brown-50/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight text-brown-900"
        >
          Ideata
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-sm text-brown-600 hover:text-brown-900 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/"
            className="text-sm text-brown-600 hover:text-brown-900 transition-colors"
          >
            Home
          </Link>
          <SignedOut>
            <Link
              href="/#how-it-works"
              className="text-sm text-brown-600 hover:text-brown-900 transition-colors"
            >
              How it works
            </Link>
            <Link
              href="/#features"
              className="text-sm text-brown-600 hover:text-brown-900 transition-colors"
            >
              Features
            </Link>
            <Link
              href="/#pricing"
              className="text-sm text-brown-600 hover:text-brown-900 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-sm text-brown-600 hover:text-brown-900 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-brown-800 px-4 py-2.5 text-sm font-medium text-brown-50 hover:bg-brown-900 transition-colors"
            >
              Get started
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/profile"
              className="text-sm text-brown-600 hover:text-brown-900 transition-colors"
            >
              Profile
            </Link>
            <SignOutButton signOutOptions={{ redirectUrl: "/" }}>
              <button
                type="button"
                className="text-sm text-brown-600 hover:text-brown-900 transition-colors"
              >
                Log out
              </button>
            </SignOutButton>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9",
                },
              }}
            />
          </SignedIn>
        </nav>
      </div>
    </header>
  );
}
