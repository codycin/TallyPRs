"use client";
import { useEffect, useState } from "react";
import { BiLeftArrowCircle, BiLoaderAlt } from "react-icons/bi";

import { getFollowers } from "@/services/Profile/profile";
import { followUserResponse } from "@/types/follow";

import { useRouter } from "next/navigation";
import UserCard from "@/components/userCard";
import { unfollowUser, followUser } from "@/services/Follow/followService";
import { use } from "react";

export default function followerPage({
  params,
}: {
  params: Promise<{ userid: string }>;
}) {
  const router = useRouter();

  const [followers, setFollowers] = useState<followUserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [query, setQuery] = useState("");

  const userId = use(params);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUserId(localStorage.getItem("currentUserId"));
  }, []);

  useEffect(() => {
    async function loadFollowers() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const data = await getFollowers(userId.userid);
        setFollowers(data);
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

    loadFollowers();
  }, []);

  async function handleFollowClicked(userId: string, isFollowed: boolean) {
    setUpdatingId(userId);
    try {
      if (isFollowed) {
        await unfollowUser(userId);
      } else {
        await followUser({ FollowedId: userId });
      }
      setFollowers((prev) =>
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
            <div className="flex gap-4 items-baseline">
              <BiLeftArrowCircle
                className="mb-2 h-6 w-6"
                onClick={() => {
                  router.back();
                }}
              />
              <h1 className="text-3xl mb-6 font-bold tracking-tight text-zinc-50">
                Followers
              </h1>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-lg shadow-black/20">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-base sm:text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-sky-700 focus:bg-zinc-950 focus:ring-4 focus:ring-sky-950"
              />
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-lg shadow-black/20">
              {followers.map((following) => (
                <UserCard
                  key={following.id}
                  follow={following}
                  currentUserId={currentUserId}
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
