"use client";

import { useEffect, useState } from "react";
import { BiUser, BiLoaderAlt } from "react-icons/bi";

import { getProfile } from "@/services/Profile/profile";
import { UserProfileResponse } from "@/types/profile";

import { useRouter } from "next/navigation";

import Feed from "@/components/Feed";
import PostCard from "@/components/PostCard";
import { getUserPostFeed } from "@/services/Feed/feedService";
import type { PostResponse } from "@/types/post";

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const userId = profile?.userId;

  useEffect(() => {
    async function loadProfile() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const data = await getProfile();
        setProfile(data);
      } catch (error) {
        console.error(error);
        if (
          error instanceof Error &&
          error.message === "API failed with status 401"
        ) {
          router.push(`/login`);
        } else
          setErrorMessage(
            error instanceof Error ? error.message : "Failed to load profile.",
          );
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, []);

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
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto min-h-screen w-full max-w-2xl bg-black md:min-h-0 md:rounded-3xl md:shadow-xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-black px-4 py-4 md:rounded-t-3xl">
          <h1 className="text-lg font-semibold text-white">My Profile</h1>
          <button
            type="button"
            className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={() => router.push("/profile/edit")}
          >
            Edit
          </button>
        </header>

        <section className="space-y-6 p-4 md:p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-gray-700 bg-zinc-900">
              {profile?.profilePicture?.url ? (
                <img
                  src={
                    profile?.profilePicture?.url
                      ? `${profile.profilePicture.url}?t=${Date.now()}`
                      : undefined
                  }
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <BiUser size={40} className="text-gray-400" />
              )}
            </div>

            <div className="text-center">
              <h2 className="text-xl font-semibold text-white">
                {profile?.displayName || "No display name set"}
              </h2>
              <p className="mt-1 text-sm text-gray-400">{profile?.userId}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm text-gray-400 text-center">
            <button
              className="mx-auto w-fit rounded-md bg-blue-600 px-1 py-1 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => router.push("/profile/followers")}
            >
              Followers: {profile?.followCount}
            </button>
            <button
              className="mx-auto w-fit rounded-md bg-gray-600 px-1 py-1 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => router.push("/profile/following")}
            >
              Following: {profile?.followingCount}
            </button>
          </div>
          <div className="grid gap-4">
            <div className="rounded-2xl border border-gray-800 bg-zinc-900/60 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Home Gym
              </p>
              <p className="mt-2 text-sm text-white">
                {profile?.homeGym || "Not set"}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-zinc-900/60 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Lifter Type
              </p>
              <p className="mt-2 text-sm text-white">
                {profile?.lifterType || "Not set"}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-zinc-900/60 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Specialty Lifts
              </p>
              <p className="mt-2 text-sm text-white">
                {profile?.specialtyLifts || "Not set"}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-zinc-900/60 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Measurements JSON
              </p>
              <pre className="mt-2 whitespace-pre-wrap wrap-break-words text-sm text-white">
                {profile?.measurementsJson || "Not set"}
              </pre>
            </div>
          </div>
        </section>
        {userId && (
          <section className="border-t border-gray-800">
            <div className="px-4 py-3 md:px-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
                Posts
              </h2>
            </div>

            <Feed<PostResponse>
              fetchPage={(cursor) => getUserPostFeed(userId, 20, cursor)}
              getKey={(post) => post.id}
              renderItem={(post, { removeItem }) => (
                <PostCard post={post} onDeleted={removeItem} />
              )}
            />
          </section>
        )}
      </div>
    </main>
  );
}
