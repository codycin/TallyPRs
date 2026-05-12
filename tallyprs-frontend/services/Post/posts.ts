import { apiFetch } from "../apiClient";
import { CreatePostRequest, PostResponse } from "@/types/post";

export async function getPostById(postId: string): Promise<PostResponse> {
  const response = await apiFetch(`/posts/${postId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch post");
  }

  return response.json();
}

export async function createPost(request: CreatePostRequest) {
  const response = await apiFetch("/posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const json = await response.json();
      console.error("Create post failed:", json);
      throw new Error(JSON.stringify(json, null, 2));
    }

    const text = await response.text();
    console.error("Create post failed:", text);
    throw new Error(text || "Failed to create post.");
  }

  return response.json();
}

export async function deletePost(postId: string) {
  const response = await apiFetch(`/posts/${postId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const text = await response.text();

  if (!response.ok) {
    console.error("Delete post failed:", text);
    throw new Error(text || "Failed to delete post.");
  }
  return text;
}
export async function deletePostAsAdmin(postId: string, comment: string) {
  const response = await apiFetch(`/posts/${postId}/admin`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ comment }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Delete post failed:", text);
    throw new Error(text || "Failed to delete post.");
  }
}

export async function updatePost(postId: string, request: CreatePostRequest) {
  const response = await apiFetch(`/posts/${postId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const text = await response.text();

  if (!response.ok) {
    console.error("Update post failed:", text);
    throw new Error(text || "Failed to update post.");
  }

  return text;
}

export async function votePost(postId: string, voteValue: number) {
  const response = await apiFetch(`/posts/${postId}/votes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ vote: voteValue }),
  });

  const text = await response.text();

  if (!response.ok) {
    console.error("Vote post failed:", text);
    throw new Error(text || "Failed to vote post.");
  }

  return text;
}

export async function removeVotePost(postId: string) {
  const response = await apiFetch(`/votes/${postId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const text = await response.text();

  if (!response.ok) {
    console.error("Vote post failed:", text);
    throw new Error(text || "Failed to remove vote from post.");
  }

  return text;
}
