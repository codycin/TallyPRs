"use client";

import { useEffect, useState } from "react";
import { searchUsers } from "@/services/UserSearch/userSearchService";
import { UserSearchResult } from "@/types/userSearch";
import Link from "next/link";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      setUsers([]);
      setError("");
      setLoading(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError("");

        const results = await searchUsers(trimmedQuery);
        setUsers(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to search users");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-zinc-50">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-zinc-50">
          Search Users
        </h1>

        <p className="mb-6 text-sm text-zinc-500">
          Find lifters by username or display name.
        </p>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-lg shadow-black/20">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-sky-700 focus:bg-zinc-950 focus:ring-4 focus:ring-sky-950"
          />
        </div>

        {loading && <p className="mt-4 text-sm text-zinc-500">Searching...</p>}

        {error && (
          <p className="mt-4 rounded-xl border border-rose-900/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
            {error}
          </p>
        )}

        <section className="mt-6 space-y-4">
          {users.map((user) => (
            <UserSearchCard key={user.userId} user={user} />
          ))}
        </section>

        {!loading &&
          query.trim().length >= 2 &&
          users.length === 0 &&
          !error && (
            <p className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-center text-sm text-zinc-500">
              No users found.
            </p>
          )}
      </div>
    </main>
  );
}

function UserSearchCard({ user }: { user: UserSearchResult }) {
  const displayName = user.displayName || user.userName;

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-lg shadow-black/20 transition hover:border-zinc-700 hover:bg-zinc-900/80">
      <Link href={`/profile/${user.userId}`} className="shrink-0">
        {user.profilePictureUrl ? (
          <img
            src={user.profilePictureUrl}
            alt={`${displayName}'s profile picture`}
            className="h-14 w-14 rounded-full object-cover ring-1 ring-zinc-700"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-lg font-semibold text-zinc-300 ring-1 ring-zinc-700">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          href={`/profiles/${user.userId}`}
          className="block truncate font-semibold text-zinc-100 hover:text-white hover:underline"
        >
          {displayName}
        </Link>

        <p className="truncate text-sm text-zinc-500">@{user.userName}</p>
      </div>

      <Link
        href={`/profile/${user.userId}`}
        className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
      >
        View
      </Link>
    </div>
  );
}
