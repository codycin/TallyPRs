"use client";
import { useEffect, useState } from "react";
import { BiUser, BiLoaderAlt } from "react-icons/bi";

import { getFollowing } from "@/services/Profile/profile";
import { UserProfileResponse } from "@/types/profile";
import { followUserResponse } from "@/types/follow";

import { unfollowUser, followUser } from "@/services/Follow/followService";

import { useRouter } from "next/navigation";

import UserCard from "@/components/userCard";

export default function FollowingPage() {
  const router = useRouter();

  const [following, setFollowing] = useState<followUserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [query, setQuery] = useState("");

  useEffect(() => {
    async function loadFollowing() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const data = await getFollowing();
        setFollowing(data);
      } catch (error) {
        console.error(error);
        if (
          error instanceof Error &&
          error.message === "API failed with status 401"
        ) {
          router.push(`/login`);
        } else
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Failed to load followers.",
          );
      } finally {
        setIsLoading(false);
      }
    }

    loadFollowing();
  }, []);

  async function handleFollowClicked(userId: string, isFollowed: boolean) {
    setUpdatingId(userId);
    try {
      if (isFollowed) {
        await unfollowUser(userId);
      } else {
        await followUser({ FollowedId: userId });
      }
      setFollowing((prev) =>
        prev.map((user) =>
          user.userId === userId
            ? {
                ...user,
                currentUserFollows: !isFollowed,
              }
            : user,
        ),
      );
    } catch (error) {
      console.error("follow toggle error:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update follow status.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center bg-black md:my-8 md:min-h-100 md:rounded-3xl md:shadow-xl">
          <div className="flex items-center gap-3 text-sm text-gray-300">
            <BiLoaderAlt className="animate-spin" size={20} />
            Loading profile...
          </div>
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto min-h-screen w-full max-w-2xl bg-black p-4 md:my-8 md:min-h-0 md:rounded-3xl md:shadow-xl md:p-6">
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {errorMessage}
          </div>
        </div>
      </main>
    );
  }
  return (
    <>
      <main className="min-h-screen bg-black px-4 py-8 text-zinc-50">
        <section className="mx-auto max-w-3xl">
          <div className="mb-6 items-center justify-between gap-4">
            <h1 className="text-3xl mb-6 font-bold tracking-tight text-zinc-50">
              Following
            </h1>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-lg shadow-black/20">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-base sm:text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-sky-700 focus:bg-zinc-950 focus:ring-4 focus:ring-sky-950"
              />
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-lg shadow-black/20">
              {following.map((following) => (
                <UserCard
                  key={following.id}
                  follow={following}
                  updating={updatingId === following.id}
                  onClicked={handleFollowClicked}
                />
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
