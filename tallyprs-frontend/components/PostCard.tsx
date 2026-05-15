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
import { deletePost, deletePostAsAdmin } from "@/services/Post/posts";
import Judge from "./Judge";
import {
  BiChevronUp,
  BiChevronDown,
  BiCommentDetail,
  BiTrash,
  BiUser,
  BiCalendar,
  BiPlay,
  BiMessageSquareAdd,
  BiSend,
  BiX,
  BiSolidEditAlt,
  BiCheckCircle,
  BiTimeFive,
  BiXCircle,
} from "react-icons/bi";

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
    if (isDeleting) return;

    let adminComment = "";

    if (isAdmin && currentUserId !== post.userId) {
      const comment = window.prompt(
        "Why are you deleting this post? This reason will be sent to the user.",
      );

      if (comment === null) return; // Admin clicked cancel

      adminComment = comment.trim();

      if (!adminComment) {
        setDeleteError("Admin deletion requires a reason.");
        return;
      }
    } else {
      const confirmed = window.confirm("Delete this post?");
      if (!confirmed) return;
    }

    try {
      setIsDeleting(true);
      setDeleteError("");

      if (isAdmin && currentUserId !== post.userId) {
        await deletePostAsAdmin(post.id, adminComment);
      } else {
        await deletePost(post.id);
      }

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
    <article className="w-full max-w-2xl mx-auto overflow-hidden border border-zinc-800 bg-zinc-950 shadow-lg shadow-black/20 transition hover:border-zinc-700 md:rounded-3xl">
      <div className="space-y-4 p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href={`/profile/${post.userId}`}
              className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-zinc-900 ring-1 ring-zinc-700 transition hover:ring-zinc-500"
            >
              {post?.profilePictureUrl ? (
                <img
                  src={post.profilePictureUrl}
                  alt={`${post.userName}'s profile picture`}
                  className="block h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-zinc-400">
                  <BiUser className="text-xl" />
                </div>
              )}
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/profile/${post.userId}`}
                  className="font-semibold text-zinc-100 hover:text-white hover:underline"
                >
                  {post.userName}
                </Link>
              </div>

              <div className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500">
                <BiCalendar className="text-sm" />
                <span>{createdDate}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentUserId === post.userId && (
              <Link
                href={`/post/${post.id}/edit`}
                className="inline-flex items-center gap-1.5 rounded-full border border-blue-900/70 bg-blue-950/40 px-3 py-1.5 text-xs font-medium text-blue-300 transition hover:border-blue-700 hover:bg-blue-900/50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <BiSolidEditAlt className="text-sm" />
                Edit
              </Link>
            )}

            {(currentUserId === post.userId || isAdmin) && (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-900/70 bg-rose-950/40 px-3 py-1.5 text-xs font-medium text-rose-300 transition hover:border-rose-700 hover:bg-rose-900/50 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleDeletePost}
                disabled={isDeleting}
              >
                <BiTrash className="text-sm" />
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>
        </div>

        {/* Title + Lift */}
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-zinc-50">
            {post.title}
          </h2>

          {post.weight !== null && (
            <div className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-sm font-semibold text-zinc-300">
              {post.weight} {post.unit}
            </div>
          )}
        </div>

        {/* Media */}
        {post.media.length > 0 && (
          <div className="-mx-4 sm:-mx-5 md:mx-0">
            <div className="flex snap-x snap-mandatory overflow-x-auto rounded-none md:rounded-2xl">
              {post.media.map((m, index) => {
                if (m.kind === "Image") {
                  return (
                    <div
                      key={m.id}
                      className="relative min-w-full snap-center overflow-hidden bg-black md:rounded-2xl"
                    >
                      <img
                        src={m.url}
                        alt={`post media ${index + 1}`}
                        className="h-105 max-h-[70vh] w-full object-cover md:rounded-2xl"
                      />

                      {post.media.length > 1 && (
                        <div className="absolute right-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white ring-1 ring-white/10 backdrop-blur">
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
                      className="relative min-w-full snap-center overflow-hidden bg-black md:rounded-2xl"
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
                              className="h-105 max-h-[70vh] w-full object-cover md:rounded-2xl"
                            />
                          ) : (
                            <div className="flex h-105 max-h-[70vh] w-full items-center justify-center bg-zinc-900 text-sm text-zinc-400">
                              Video ready
                            </div>
                          )}

                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100/90 text-3xl text-zinc-950 shadow-lg backdrop-blur transition hover:scale-105">
                              <BiPlay className="ml-1" />
                            </div>
                          </div>

                          {m.durationSeconds != null && (
                            <div className="absolute bottom-3 right-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white ring-1 ring-white/10 backdrop-blur">
                              {formatDuration(m.durationSeconds)}
                            </div>
                          )}

                          {post.media.length > 1 && (
                            <div className="absolute right-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white ring-1 ring-white/10 backdrop-blur">
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
                          className="h-105 max-h-[70vh] w-full object-contain md:rounded-2xl"
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
          <p className="text-sm leading-6 text-zinc-300">{post.description}</p>
        )}

        {/* Status Badge */}
        {post.liftId !== "019e2800-c24a-7e77-943e-1a81f096116f" &&
          post.liftId != null && (
            <div className="space-y-3">
              {status === 0 && (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-800/70 bg-amber-950/40 px-3 py-1 text-xs font-semibold text-amber-300">
                  <BiTimeFive className="text-sm" />
                  Pending review
                </div>
              )}

              {status === 1 && (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-800/70 bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-300">
                  <BiCheckCircle className="text-sm" />
                  Approved PR
                </div>
              )}

              {status === 2 && (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-800/70 bg-rose-950/40 px-3 py-1 text-xs font-semibold text-rose-300">
                  <BiXCircle className="text-sm" />
                  Rejected
                </div>
              )}

              {isAdmin && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
                  <Judge
                    post={post}
                    onDeleted={onDeleted}
                    onJudged={handleJudged}
                  />
                </div>
              )}
            </div>
          )}

        {/* Engagement */}
        <div className="flex items-center gap-2 border-t border-zinc-800 pt-3 text-sm">
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition ${
              voteValue === 1
                ? "bg-emerald-950/60 text-emerald-300 ring-1 ring-emerald-800/70"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
            } disabled:cursor-not-allowed disabled:opacity-60`}
            disabled={voteBusy}
            onClick={() => {
              if (voteValue === -1 || voteValue === 0 || voteValue === null) {
                if (voteBusy) return;
                setVoteBusy(true);
                try {
                  votePost(post.id, 1);
                  setVoteValue(1);
                  setVoteCount(voteCount + 1);
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
                } finally {
                  setVoteBusy(false);
                }
              }
            }}
          >
            <BiChevronUp className="text-xl" />
            <span>{voteCount}</span>
          </button>

          <button
            type="button"
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition ${
              voteValue === -1
                ? "bg-rose-950/60 text-rose-300 ring-1 ring-rose-800/70"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
            }`}
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
            }}
          >
            <BiChevronDown className="text-xl" />
          </button>

          <button
            type="button"
            onClick={toggleComments}
            className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition ${
              commentsOpen
                ? "bg-sky-950/60 text-sky-300 ring-1 ring-sky-800/70"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
            }`}
          >
            <BiCommentDetail className="text-lg" />
            <span>{commentCount}</span>
          </button>
        </div>

        {/* Comments Section */}
        {commentsOpen && (
          <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-100">Comments</h3>

              <button
                type="button"
                onClick={() => setCommentFormOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 ring-1 ring-zinc-700 transition hover:bg-zinc-700"
              >
                <BiMessageSquareAdd className="text-sm" />
                Add comment
              </button>
            </div>

            {commentFormOpen && (
              <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-3 shadow-sm">
                <textarea
                  value={newCommentBody}
                  onChange={(e) => setNewCommentBody(e.target.value)}
                  placeholder="Write a comment..."
                  className="min-h-24 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-sky-700 focus:bg-zinc-950 focus:ring-4 focus:ring-sky-950"
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCommentFormOpen(false);
                      setNewCommentBody("");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-100"
                  >
                    <BiX />
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={submitComment}
                    disabled={
                      commentSubmitting || newCommentBody.trim().length === 0
                    }
                    className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-4 py-1.5 text-sm font-semibold text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <BiSend />
                    {commentSubmitting ? "Posting..." : "Post"}
                  </button>
                </div>
              </div>
            )}

            {commentLoadState === "loading" && (
              <div className="space-y-2">
                <div className="animate-pulse rounded-2xl bg-zinc-950 p-3 ring-1 ring-zinc-800">
                  <div className="mb-2 h-3 w-24 rounded bg-zinc-800" />
                  <div className="mb-1 h-3 w-full rounded bg-zinc-800" />
                  <div className="h-3 w-2/3 rounded bg-zinc-800" />
                </div>

                <div className="animate-pulse rounded-2xl bg-zinc-950 p-3 ring-1 ring-zinc-800">
                  <div className="mb-2 h-3 w-20 rounded bg-zinc-800" />
                  <div className="mb-1 h-3 w-full rounded bg-zinc-800" />
                  <div className="h-3 w-1/2 rounded bg-zinc-800" />
                </div>
              </div>
            )}

            {commentLoadState === "error" && (
              <div className="rounded-xl border border-rose-900/70 bg-rose-950/40 px-3 py-2 text-sm text-rose-300">
                Failed to load comments.
              </div>
            )}

            {commentLoadState === "loaded" && comments.length === 0 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-4 text-center text-sm text-zinc-500">
                No comments yet.
              </div>
            )}

            {commentLoadState === "loaded" && comments.length > 0 && (
              <div className="space-y-3">
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
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {deleteError && (
          <div className="rounded-xl border border-rose-900/70 bg-rose-950/40 px-3 py-2 text-sm text-rose-300">
            {deleteError}
          </div>
        )}
      </div>
    </article>
  );
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
