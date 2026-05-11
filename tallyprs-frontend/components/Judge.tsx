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
  const [formBody, setNewBody] = useState("");
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
    <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 text-black shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-gray-900">
            Admin Review
          </h2>
          <p className="text-xs text-gray-500">
            Update the post status and leave a note.
          </p>
        </div>

        <div
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            currentStatus === 1
              ? "bg-green-100 text-green-700"
              : currentStatus === 2
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700"
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
            className="text-xs font-medium uppercase tracking-wide text-gray-500"
          >
            Judge Note
          </label>

          <textarea
            id="judgeNote"
            value={currentJudgeNote}
            onChange={(e) => setCurrentJudgeNote(e.target.value)}
            placeholder="Leave feedback or reasoning..."
            rows={4}
            className="resize-none rounded-xl border border-gray-300 bg-gray-50 p-3 text-sm text-black outline-none transition focus:border-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="status"
            className="text-xs font-medium uppercase tracking-wide text-gray-500"
          >
            Status
          </label>

          <select
            id="status"
            value={currentStatus}
            onChange={(e) => setCurrentStatus(parseInt(e.target.value))}
            className="rounded-xl border border-gray-300 bg-gray-50 p-3 text-sm text-black outline-none transition focus:border-blue-500 focus:bg-white"
          >
            <option value={0}>Pending</option>
            <option value={1}>Approved</option>
            <option value={2}>Rejected</option>
          </select>
        </div>
      </div>

      <button
        onClick={submitJudge}
        disabled={judgeSubmitting}
        className="mt-5 w-full rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {judgeSubmitting ? "Submitting..." : "Save Review"}
      </button>
    </div>
  );
}
