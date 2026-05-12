"use client";

import Feed from "@/components/Feed";
import PostCard from "@/components/PostCard";
import { getPostFeed } from "@/services/Feed/feedService";
import type { PostResponse } from "@/types/post";
import { useState } from "react";

export default function HomeFeedClient() {
  const [activeTab, setActiveTab] = useState<"Following" | "Global">("Global");

  function changeTab(tab: "Following" | "Global") {
    setActiveTab(tab);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="sticky top-0 z-20 flex justify-center border-b border-zinc-900 bg-black/90 py-3 backdrop-blur">
        <div className="flex rounded-full border border-zinc-800 bg-zinc-950 p-1 shadow-lg shadow-black/20">
          <button
            onClick={() => changeTab("Following")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              activeTab === "Following"
                ? "bg-zinc-100 text-zinc-950"
                : "text-zinc-500 hover:text-zinc-100"
            }`}
          >
            Following
          </button>

          <button
            onClick={() => changeTab("Global")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              activeTab === "Global"
                ? "bg-zinc-100 text-zinc-950"
                : "text-zinc-500 hover:text-zinc-100"
            }`}
          >
            Global
          </button>
        </div>
      </div>

      {activeTab === "Following" ? (
        <Feed<PostResponse>
          fetchPage={(cursor) => getPostFeed("Following", 20, cursor)}
          getKey={(post) => post.id}
          renderItem={(post, { removeItem }) => (
            <PostCard post={post} onDeleted={removeItem} />
          )}
        />
      ) : (
        <Feed<PostResponse>
          fetchPage={(cursor) => getPostFeed("Global", 20, cursor)}
          getKey={(post) => post.id}
          renderItem={(post, { removeItem }) => (
            <PostCard post={post} onDeleted={removeItem} />
          )}
        />
      )}
    </div>
  );
}
