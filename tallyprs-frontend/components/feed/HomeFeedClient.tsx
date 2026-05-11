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
    <>
      <div className="bg-white">
        <div className="sticky top-0 z-20 flex justify-center border-b border-gray-100 bg-white/80 py-2 backdrop-blur">
          {" "}
          <div className="flex rounded-full border border-gray-200 bg-gray-50 p-1">
            <button
              onClick={() => changeTab("Following")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                activeTab === "Following"
                  ? "bg-black text-white"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              Following
            </button>

            <button
              onClick={() => changeTab("Global")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                activeTab === "Global"
                  ? "bg-black text-white"
                  : "text-gray-500 hover:text-black"
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
    </>
  );
}
