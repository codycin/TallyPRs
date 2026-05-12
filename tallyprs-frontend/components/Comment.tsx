import { CommentResponse } from "@/types/comment";

export default function CommentItem({
  comment,
  currentUserId,
  replyingToCommentId,
  setReplyingToCommentId,
  replyBody,
  setReplyBody,
  submitCommentReply,
  commentSubmitting,
  onDeleteComment,
  isAdmin = false,
}: {
  comment: CommentResponse;
  currentUserId: string | null;
  replyingToCommentId: string | null;
  setReplyingToCommentId: React.Dispatch<React.SetStateAction<string | null>>;
  replyBody: string;
  setReplyBody: React.Dispatch<React.SetStateAction<string>>;
  submitCommentReply: (commentId: string) => void;
  commentSubmitting: boolean;
  onDeleteComment: (commentId: string) => void;
  isAdmin?: boolean;
}) {
  const canDelete = currentUserId === comment.userId || isAdmin;
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="mb-1 text-xs font-medium text-zinc-400">
          {comment.userName}
        </div>

        {canDelete && (
          <button
            type="button"
            className="rounded-full px-2 py-1 text-xs font-medium text-rose-400 transition hover:bg-rose-950/50 hover:text-rose-300"
            onClick={() => onDeleteComment(comment.id)}
          >
            Delete
          </button>
        )}
      </div>

      <p className="text-sm leading-6 text-zinc-200">{comment.body}</p>

      <button
        type="button"
        className="mt-2 text-xs font-medium text-zinc-500 transition hover:text-zinc-300"
        onClick={() => setReplyingToCommentId(comment.id)}
      >
        Reply
      </button>

      {replyingToCommentId === comment.id && (
        <div className="mt-3 space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="Write a reply..."
            className="min-h-20 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-sky-700 focus:ring-4 focus:ring-sky-950"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setReplyingToCommentId(null);
                setReplyBody("");
              }}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => submitCommentReply(comment.id)}
              disabled={commentSubmitting || replyBody.trim().length === 0}
              className="rounded-full bg-zinc-100 px-4 py-1.5 text-sm font-semibold text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {commentSubmitting ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      )}

      {comment.replies?.length > 0 && (
        <div className="mt-3 ml-4 space-y-2 border-l border-zinc-800 pl-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              replyingToCommentId={replyingToCommentId}
              setReplyingToCommentId={setReplyingToCommentId}
              replyBody={replyBody}
              setReplyBody={setReplyBody}
              submitCommentReply={submitCommentReply}
              commentSubmitting={commentSubmitting}
              onDeleteComment={onDeleteComment}
            />
          ))}
        </div>
      )}
    </div>
  );
}
