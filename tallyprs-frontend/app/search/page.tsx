"use client";
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
    <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-500">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Search Users</h1>

        <p className="mb-6 text-sm text-gray-600">
          Find lifters by username or display name.
        </p>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900"
          />
        </div>

        {loading && <p className="mt-4 text-sm text-gray-500">Searching...</p>}

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
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
            <p className="mt-6 text-sm text-gray-500">No users found.</p>
          )}
      </div>
    </main>
  );
}

function UserSearchCard({ user }: { user: UserSearchResult }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <Link href={`/profiles/${user.userId}`} className="shrink-0">
        {user.profilePictureUrl ? (
          <img
            src={user.profilePictureUrl}
            alt={`${user.displayName || user.userName}'s profile picture`}
            className="h-14 w-14 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-lg font-semibold text-gray-700">
            {(user.displayName || user.userName).charAt(0).toUpperCase()}
          </div>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          href={`/profiles/${user.userId}`}
          className="block truncate font-semibold text-gray-900 hover:underline"
        >
          {user.displayName || user.userName}
        </Link>

        <p className="truncate text-sm text-gray-500">@{user.userName}</p>
      </div>

      <Link
        href={`/profile/${user.userId}`}
        className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-100"
      >
        View
      </Link>
    </div>
  );
}
