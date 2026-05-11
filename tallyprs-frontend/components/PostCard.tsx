"use client";

import { CommentResponse } from "@/types/comment";
import CommentItem from "./Comment";
import { removeVotePost, votePost } from "@/services/Post/posts";
import {
  createComment,
  createCommentReply,
  getCommentsForPost,
  deleteComment,
} from "@/services/Comment/commentService";
import { PostResponse } from "@/types/post";
import { useEffect, useState } from "react";
import Link from "next/link";
import { deletePost } from "@/services/Post/posts";
import Judge from "./Judge";

type PostCardProps = {
  post: PostResponse;
  onDeleted?: (postId: string) => void;
};

type CommentLoadState = "idle" | "loading" | "loaded" | "error";

export default function PostCard({ post, onDeleted }: PostCardProps) {
  const [playingVideos, setPlayingVideos] = useState<Record<string, boolean>>(
    {},
  );

  function startVideo(mediaId: string) {
    setPlayingVideos((prev) => ({
      ...prev,
      [mediaId]: true,
    }));
  }

  const currentUserId = localStorage.getItem("currentUserId");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const created = new Date(post.createdAt).toLocaleString();

  const [voteBusy, setVoteBusy] = useState(false);
  const [voteCount, setVoteCount] = useState(post.voteCount);
  const [voteValue, setVoteValue] = useState<number | null>(
    post.myVoteValue ?? null,
  );

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [commentFormOpen, setCommentFormOpen] = useState(false);
  const [newCommentBody, setNewCommentBody] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const isAdmin = localStorage.getItem("role") === "Admin";

  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(
    null,
  );
  const [replyBody, setReplyBody] = useState("");

  const [commentLoadState, setCommentLoadState] =
    useState<CommentLoadState>("idle");
  const [comments, setComments] = useState<CommentResponse[]>([]);
  useEffect(() => {
    setVoteValue(post.myVoteValue ?? null);
  }, [post.myVoteValue]);

  async function toggleComments() {
    const nextOpen = !commentsOpen;
    setCommentsOpen(nextOpen);

    if (nextOpen && commentLoadState === "idle") {
      setCommentLoadState("loading");

      try {
        const data = await getCommentsForPost(post.id);

        setComments(data);
        setCommentLoadState("loaded");
      } catch (error) {
        console.error("Failed to load comments", error);
        setCommentLoadState("error");
      }
    }
  }
  async function submitComment() {
    const body = newCommentBody.trim();

    if (!body || commentSubmitting) return;

    setCommentSubmitting(true);

    try {
      const created = await createComment(
        {
          body,
        },
        post.id,
      );

      // add new comment to UI immediately
      setComments((prev) => [created, ...prev]);

      setNewCommentBody("");
      setCommentFormOpen(false);
      setCommentLoadState("loaded");
      setCommentCount(commentCount + 1);
    } catch (error) {
      console.error("Failed to create comment", error);
    } finally {
      setCommentSubmitting(false);
    }
  }
  async function submitCommentReply(commentId: string) {
    const body = replyBody.trim();

    if (!body || commentSubmitting) return;

    setCommentSubmitting(true);

    try {
      const created = await createCommentReply({ body }, post.id, commentId);

      setComments((prev) => addReplyToCommentTree(prev, commentId, created));

      setReplyBody("");
      setReplyingToCommentId(null);
      setCommentLoadState("loaded");
      setCommentCount((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to create reply", error);
    } finally {
      setCommentSubmitting(false);
    }
  }
  function addReplyToCommentTree(
    comments: CommentResponse[],
    parentCommentId: string,
    reply: CommentResponse,
  ): CommentResponse[] {
    return comments.map((comment) => {
      if (comment.id === parentCommentId) {
        return {
          ...comment,
          replies: [...(comment.replies ?? []), reply],
        };
      }

      return {
        ...comment,
        replies: addReplyToCommentTree(
          comment.replies ?? [],
          parentCommentId,
          reply,
        ),
      };
    });
  }
  async function handleDeleteComment(commentId: string) {
    try {
      await deleteComment(commentId);

      setComments((prev) => removeCommentFromTree(prev, commentId));
      setCommentCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to delete comment", error);
    }
  }
  function removeCommentFromTree(
    comments: CommentResponse[],
    commentId: string,
  ): CommentResponse[] {
    return comments
      .filter((comment) => comment.id !== commentId)
      .map((comment) => ({
        ...comment,
        replies: removeCommentFromTree(comment.replies ?? [], commentId),
      }));
  }

  const [status, setStatus] = useState(post.status);
  function handleJudged(newStatus: number) {
    setStatus(newStatus);
  }

  async function handleDeletePost() {
    const confirmed = window.confirm("Delete this post?");
    if (!confirmed || isDeleting) return;

    try {
      setIsDeleting(true);
      setDeleteError("");

      await deletePost(post.id);

      onDeleted?.(post.id);
    } catch (error) {
      console.error("delete post error:", error);
      setDeleteError(
        error instanceof Error ? error.message : "Failed to delete post.",
      );
    } finally {
      setIsDeleting(false);
    }
  }
  const createdDate = new Date(post.createdAt).toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
  });

  return (
    <article className="w-full max-w-2xl mx-auto bg-white md:rounded-2xl md:shadow p-4 space-y-3">
      {/* header */}

      <div className="flex justify-between items-center text-sm text-gray-500">
        <div className="">
          <span className="font-medium text-gray-800">{post.userName}</span>
        </div>
        <div className="space-x-5">
          <span>{createdDate}</span>

          {(currentUserId === post.userId || isAdmin) && (
            <button
              type="button"
              className="rounded-full px-2 py-1 text-xs font-medium bg-red-500/10 text-red-400"
              onClick={handleDeletePost}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>
      </div>
      {currentUserId !== post.userId && (
        <Link
          href={`/profile/${post.userId}`}
          className="text-sm  text-gray-500"
        >
          View profile
        </Link>
      )}

      {/* Title + Lift */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{post.title}</h2>
        {post.weight !== null && (
          <p className="text-sm text-gray-600">
            {post.weight} {post.unit}
          </p>
        )}
      </div>

      {/* Media */}
      {post.media.length > 0 && (
        <div className="-mx-4 md:mx-0">
          <div className="flex snap-x snap-mandatory overflow-x-auto rounded-none md:rounded-xl">
            {post.media.map((m, index) => {
              if (m.kind === "Image") {
                return (
                  <div
                    key={m.id}
                    className="relative min-w-full snap-center overflow-hidden bg-zinc-950"
                  >
                    <img
                      src={m.url}
                      alt={`post media ${index + 1}`}
                      className="h-105 max-h-[70vh] w-full object-cover md:rounded-xl"
                    />

                    {post.media.length > 1 && (
                      <div className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">
                        {index + 1}/{post.media.length}
                      </div>
                    )}
                  </div>
                );
              }

              if (m.kind === "Video") {
                const isPlaying = !!playingVideos[m.id];

                return (
                  <div
                    key={m.id}
                    className="relative min-w-full snap-center overflow-hidden bg-black md:rounded-xl"
                  >
                    {!isPlaying ? (
                      <button
                        type="button"
                        onClick={() => startVideo(m.id)}
                        className="relative block w-full hover:cursor-pointer"
                      >
                        {m.thumbnailUrl ? (
                          <img
                            src={m.thumbnailUrl}
                            alt="video thumbnail"
                            className="h-[420px] max-h-[70vh] w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-[420px] max-h-[70vh] w-full items-center justify-center bg-gray-200 text-sm text-gray-600">
                            Video ready
                          </div>
                        )}

                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-xl text-black shadow">
                            ▶
                          </div>
                        </div>

                        {m.durationSeconds != null && (
                          <div className="absolute bottom-3 right-3 rounded bg-black/70 px-2 py-1 text-xs text-white">
                            {formatDuration(m.durationSeconds)}
                          </div>
                        )}

                        {post.media.length > 1 && (
                          <div className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">
                            {index + 1}/{post.media.length}
                          </div>
                        )}
                      </button>
                    ) : (
                      <video
                        src={m.url}
                        controls
                        playsInline
                        preload="metadata"
                        className="h-[420px] max-h-[70vh] w-full object-contain md:rounded-xl"
                      />
                    )}
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>
      )}

      {/* Description */}
      {post.description && (
        <p className="text-gray-700 text-sm">{post.description}</p>
      )}

      {/* Status Badge */}
      {post.liftId !== "00000000-0000-0000-0000-000000000000" && (
        <>
          {status === 0 && (
            <div className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700 w-fit">
              Pending...
            </div>
          )}

          {status === 1 && (
            <div className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 w-fit">
              Approved
            </div>
          )}

          {status === 2 && (
            <div className="text-xs px-2 py-1 rounded bg-red-200 text-red-700 w-fit">
              Rejected.
            </div>
          )}

          {isAdmin && (
            <Judge post={post} onDeleted={onDeleted} onJudged={handleJudged} />
          )}
        </>
      )}

      {/* Engagement */}
      <div className="flex items-center gap-4 pt-2 text-sm">
        <button
          className={`flex items-center gap-1 ${
            voteValue === 1 ? "text-green-600 font-semibold" : "text-gray-500"
          } hover:cursor-pointer`}
          onClick={() => {
            if (voteValue === -1 || voteValue === 0 || voteValue === null) {
              if (voteBusy) return;
              setVoteBusy(true);
              try {
                votePost(post.id, 1);
                setVoteValue(1);
                setVoteCount(voteCount + 1);
                console.log("UP from DOWN/NULL clicked", {
                  voteValue,
                  myVoteValue: post.myVoteValue,
                });
              } finally {
                setVoteBusy(false);
              }
            }
            if (voteValue === 1) {
              if (voteBusy) return;
              setVoteBusy(true);

              try {
                removeVotePost(post.id);
                setVoteValue(null);
                setVoteCount(voteCount - 1);
                console.log("UP FROM UP clicked", {
                  voteValue,
                  myVoteValue: post.myVoteValue,
                });
              } finally {
                setVoteBusy(false);
              }
            }
          }}
        >
          ↑ {voteCount}
        </button>

        <button
          className={`${
            voteValue === -1 ? "text-red-600 font-semibold" : "text-gray-500"
          } hover:cursor-pointer`}
          onClick={() => {
            if (voteValue === 1 || voteValue === 0 || voteValue === null) {
              votePost(post.id, -1);
              setVoteValue(-1);
              if (voteValue === 1) {
                setVoteCount(voteCount - 1);
              }
            }
            if (voteValue === -1) {
              removeVotePost(post.id);
              setVoteValue(null);
            }
            console.log("clicked", {
              voteValue,
              myVoteValue: post.myVoteValue,
            });
          }}
        >
          ↓
        </button>

        <button
          type="button"
          onClick={toggleComments}
          className="text-gray-500 hover:cursor-pointer"
        >
          💬 {commentCount}
        </button>
      </div>

      {/* Comments Section */}
      {commentsOpen && (
        <div className="pt-2 border-t border-gray-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Comments</h3>
            <button
              type="button"
              onClick={() => setCommentFormOpen((prev) => !prev)}
              className="text-xs text-gray-800 hover:underline cursor-pointer"
            >
              Add comment
            </button>
          </div>
          {commentFormOpen && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
              <textarea
                value={newCommentBody}
                onChange={(e) => setNewCommentBody(e.target.value)}
                placeholder="Write a comment..."
                className="w-full min-h-20 rounded-md border border-gray-300 bg-white p-2 text-sm text-gray-900 outline-none"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCommentFormOpen(false);
                    setNewCommentBody("");
                  }}
                  className="px-3 py-1 text-sm text-gray-600"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={submitComment}
                  disabled={
                    commentSubmitting || newCommentBody.trim().length === 0
                  }
                  className="bg-blue-600 text-white px-3 py-1 text-sm rounded disabled:opacity-50"
                >
                  {commentSubmitting ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          )}
          {commentLoadState === "loading" && (
            <div className="space-y-2">
              <div className="animate-pulse rounded-lg bg-gray-100 p-3">
                <div className="h-3 w-24 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-full bg-gray-200 rounded mb-1" />
                <div className="h-3 w-2/3 bg-gray-200 rounded" />
              </div>
              <div className="animate-pulse rounded-lg bg-gray-100 p-3">
                <div className="h-3 w-20 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-full bg-gray-200 rounded mb-1" />
                <div className="h-3 w-1/2 bg-gray-200 rounded" />
              </div>
            </div>
          )}

          {commentLoadState === "error" && (
            <div className="text-sm text-red-600">Failed to load comments.</div>
          )}

          {commentLoadState === "loaded" && comments.length === 0 && (
            <div className="text-sm text-gray-500">No comments yet.</div>
          )}

          {commentLoadState === "loaded" && comments.length > 0 && (
            <div className="space-y-3">
              {/*comments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-lg bg-gray-50 p-3 border border-gray-200"
                >
                  <div className="text-xs text-gray-500 mb-1">
                    {comment.userId}
                  </div>
                  <p className="text-sm text-gray-700">{comment.body}</p>
                  <button
                    className="text-xs text-gray-400"
                    onClick={() => setReplyingToCommentId(comment.id)}
                  >
                    reply
                  </button>
                  {replyingToCommentId === comment.id && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
                      <textarea
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        placeholder="Write a comment..."
                        className="w-full min-h-20 rounded-md border border-gray-300 bg-white p-2 text-sm text-gray-900 outline-none"
                      />

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingToCommentId(null);
                            setReplyBody("");
                          }}
                          className="px-3 py-1 text-sm text-gray-600"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            submitCommentReply(comment.id);
                          }}
                          disabled={
                            commentSubmitting || replyBody.trim().length === 0
                          }
                          className="bg-blue-600 text-white px-3 py-1 text-sm rounded disabled:opacity-50"
                        >
                          {commentSubmitting ? "Posting..." : "Post"}
                        </button>
                      </div>
                    </div>
                  )}
                  {comment.replies?.length > 0 && (
                    <div className="mt-3 ml-4 space-y-2 border-l border-gray-200 pl-3">
                      {comment.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className="rounded-lg bg-white p-2 border border-gray-200"
                        >
                          <div className="text-xs text-gray-500 mb-1">
                            {reply.userId}
                          </div>
                          <p className="text-sm text-gray-700">{reply.body}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))*/}
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUserId={currentUserId}
                  replyingToCommentId={replyingToCommentId}
                  setReplyingToCommentId={setReplyingToCommentId}
                  replyBody={replyBody}
                  setReplyBody={setReplyBody}
                  submitCommentReply={submitCommentReply}
                  commentSubmitting={commentSubmitting}
                  onDeleteComment={handleDeleteComment}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
