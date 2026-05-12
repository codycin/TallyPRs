"use client";

import { useState } from "react";
import { JudgeRequest } from "@/types/judge";
import judgePost from "@/services/Admin/judgeService";
import { PostResponse } from "@/types/post";

type Props = {
  post: PostResponse;
  onDeleted?: (postId: string) => void;
  onJudged: (newStatus: number) => void;
};

export default function Judge({ post, onDeleted, onJudged }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [judgeSubmitting, setJudgeSubmitting] = useState(false);

  const [currentJudgeNote, setCurrentJudgeNote] = useState(
    post.judgeNote || "",
  );
  const [currentStatus, setCurrentStatus] = useState(post.status);

  async function submitJudge() {
    const judgeNote = currentJudgeNote.trim();

    if (judgeSubmitting) return;

    setJudgeSubmitting(true);

    try {
      const request: JudgeRequest = {
        status: currentStatus,
        judgeNote,
      };

      const response = await judgePost(post.id, request);

      setCurrentJudgeNote(response.judgeNote);
      setCurrentStatus(response.status);

      onJudged(response.status);

      setFormOpen(false);
    } catch (error) {
      console.error("Failed to judge post", error);
    } finally {
      setJudgeSubmitting(false);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-100 shadow-lg shadow-black/20">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-zinc-100">
            Admin Review
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Update the post status and leave a note.
          </p>
        </div>

        <div
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${
            currentStatus === 1
              ? "border-emerald-800/70 bg-emerald-950/40 text-emerald-300"
              : currentStatus === 2
                ? "border-rose-800/70 bg-rose-950/40 text-rose-300"
                : "border-amber-800/70 bg-amber-950/40 text-amber-300"
          }`}
        >
          {currentStatus === 1
            ? "Approved"
            : currentStatus === 2
              ? "Rejected"
              : "Pending"}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="judgeNote"
            className="text-xs font-medium uppercase tracking-wide text-zinc-500"
          >
            Judge Note
          </label>

          <textarea
            id="judgeNote"
            value={currentJudgeNote}
            onChange={(e) => setCurrentJudgeNote(e.target.value)}
            placeholder="Leave feedback or reasoning..."
            rows={4}
            className="resize-none rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-sky-700 focus:bg-zinc-950 focus:ring-4 focus:ring-sky-950"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="status"
            className="text-xs font-medium uppercase tracking-wide text-zinc-500"
          >
            Status
          </label>

          <select
            id="status"
            value={currentStatus}
            onChange={(e) => setCurrentStatus(parseInt(e.target.value))}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-100 outline-none transition focus:border-sky-700 focus:bg-zinc-950 focus:ring-4 focus:ring-sky-950"
          >
            <option className="bg-zinc-950 text-zinc-100" value={0}>
              Pending
            </option>
            <option className="bg-zinc-950 text-zinc-100" value={1}>
              Approved
            </option>
            <option className="bg-zinc-950 text-zinc-100" value={2}>
              Rejected
            </option>
          </select>
        </div>
      </div>

      <button
        onClick={submitJudge}
        disabled={judgeSubmitting}
        className="mt-5 w-full rounded-xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {judgeSubmitting ? "Submitting..." : "Save Review"}
      </button>
    </div>
  );
}
