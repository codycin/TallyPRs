"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BiUser, BiLoaderAlt } from "react-icons/bi";
import { getPostById } from "@/services/Post/posts";
import { PostResponse } from "@/types/post";
import PostCard from "@/components/PostCard";
import { useRouter } from "next/navigation";

export default function PostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params?.postid as string | undefined;

  const [post, setPost] = useState<PostResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadPost() {
      if (!postId) {
        setErrorMessage("Missing post ID.");
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setErrorMessage("");

        const data = await getPostById(postId);
        setPost(data);
      } catch (error) {
        console.error(error);
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load post.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadPost();
  }, [postId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-zinc-500">
        <BiLoaderAlt className="animate-spin" size={20} />
        Loading post...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-rose-400">
        <BiUser size={20} />
        {errorMessage}
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-zinc-500">
        <BiUser size={20} />
        Post not found.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10">
      <PostCard post={post} onDeleted={() => router.push("/profile")} />
    </div>
  );
}
