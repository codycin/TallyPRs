"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BiUser, BiLoaderAlt } from "react-icons/bi";
import { getPublicProfile } from "@/services/Profile/profile";
import { PublicProfileResponse } from "@/types/profile";
import { followUser, unfollowUser } from "@/services/Follow/followService";
import Feed from "@/components/Feed";
import PostCard from "@/components/PostCard";
import { getUserPostFeed } from "@/services/Feed/feedService";
import type { PostResponse } from "@/types/post";
import { useRouter } from "next/navigation";

export default function PublicProfilePage() {
  //Route params
  const router = useRouter();
  const params = useParams();
  const userId = params?.userid as string | undefined;

  const [profile, setProfile] = useState<PublicProfileResponse | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setCurrentUserId(localStorage.getItem("currentUserId"));
  }, []);

  const isOwnProfile =
    !!currentUserId &&
    !!userId &&
    currentUserId.toLowerCase() === userId.toLowerCase();

  useEffect(() => {
    async function loadProfile() {
      if (!userId) {
        setErrorMessage("Missing user ID.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const data = await getPublicProfile({ userId });
        setProfile(data);
        setIsFollowing(data.isFollowedByCurrentUser);
      } catch (error) {
        console.error("loadProfile error:", error);
        router.push(`/login`);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [userId]);

  async function handleFollowToggle() {
    if (!userId || !profile || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      if (isFollowing) {
        await unfollowUser(userId);

        setIsFollowing(false);
        setProfile({
          ...profile,
          isFollowedByCurrentUser: false,
          followCount: Math.max(0, profile.followCount - 1),
        });
      } else {
        await followUser({ FollowedId: userId });

        setIsFollowing(true);
        setProfile({
          ...profile,
          isFollowedByCurrentUser: true,
          followCount: profile.followCount + 1,
        });
      }
    } catch (error) {
      console.error("follow toggle error:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update follow status.",
      );
    } finally {
      setIsSubmitting(false);
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
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto min-h-screen w-full max-w-2xl bg-black md:my-8 md:min-h-0 md:rounded-3xl md:shadow-xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-black px-4 py-4 md:rounded-t-3xl">
          <h1 className="text-lg font-semibold text-white">
            {profile?.displayName || "No display name set"}
          </h1>
        </header>

        <section className="space-y-6 p-4 md:p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-gray-700 bg-zinc-900">
              {profile?.profilePicture?.url ? (
                <img
                  src={`${profile.profilePicture.url}?t=${Date.now()}`}
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
            </div>
          </div>
          {!isOwnProfile && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={handleFollowToggle}
                disabled={isSubmitting}
                className={`flex h-11 min-w-33 items-center justify-center whitespace-nowrap rounded-full px-6 py-2 text-sm font-semibold leading-none transition
                    ${
                      isFollowing
                        ? "border border-gray-500 bg-zinc-900 text-white hover:bg-zinc-800"
                        : "bg-blue-600 text-white hover:bg-blue-500"
                    }
                    ${isSubmitting ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
                `}
              >
                {isSubmitting
                  ? "Please wait..."
                  : isFollowing
                    ? "Following"
                    : "Follow"}
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
            <div>Followers: {profile?.followCount}</div>
            <div>Following: {profile?.followingCount}</div>
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
