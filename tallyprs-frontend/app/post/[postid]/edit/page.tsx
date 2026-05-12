"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  BiImageAdd,
  BiVideo,
  BiX,
  BiLoaderAlt,
  BiText,
  BiDetail,
} from "react-icons/bi";

import imageCompression from "browser-image-compression";
import Cropper from "react-easy-crop";

import getCroppedImg from "@/utils/cropImage";
import { uploadMultipleMedia } from "@/services/mediaService";
import { MediaPurpose } from "@/types/media";
import { getPostById, updatePost } from "@/services/Post/posts";
import { LiftResponse } from "@/types/lift";
import { searchLifts } from "@/services/Lifts/liftService";

type SelectedFile = {
  localId: string;
  file: File;
  previewUrl: string;
  kind: "image" | "video" | "other";
};

type ExistingMediaItem = {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  kind: string;
  originalFileName?: string | null;
};

const NON_JUDGED_LIFT_ID = "019e18eb-688f-7f28-96e9-41ef6ffe44b7";

function getFileKind(file: File): SelectedFile["kind"] {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "other";
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const units = ["Bytes", "KB", "MB", "GB"];
  const k = 1024;
  const index = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, index);

  return `${value.toFixed(2)} ${units[index]}`;
}

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();

  const postId = params?.postid as string | undefined;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [liftId, setLiftId] = useState("");
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState("");
  const [nonJudgedLift, setNonJudgedLift] = useState(false);

  const [existingMedia, setExistingMedia] = useState<ExistingMediaItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [liftSearch, setLiftSearch] = useState("");
  const [liftResults, setLiftResults] = useState<LiftResponse[]>([]);
  const [selectedLift, setSelectedLift] = useState<LiftResponse | null>(null);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

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

        const post = await getPostById(postId);

        setTitle(post.title ?? "");
        setDescription(post.description ?? "");

        const isNonJudged = post.liftId === NON_JUDGED_LIFT_ID || !post.liftId;
        setNonJudgedLift(isNonJudged);

        if (!isNonJudged) {
          setLiftId(post.liftId ?? "");
          setWeight(post.weight != null ? String(post.weight) : "");
          setUnit(post.unit ?? "lb");
          setLiftSearch("");
        } else {
          setLiftId("019e18eb-688f-7f28-96e9-41ef6ffe44b7");
          setWeight("");
          setUnit("");
          setLiftSearch("");
        }

        setExistingMedia(
          post.media.map((m) => ({
            id: m.id,
            url: m.url,
            thumbnailUrl: m.thumbnailUrl,
            kind: m.kind,
            originalFileName: m.originalFileName,
          })),
        );
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

  useEffect(() => {
    if (nonJudgedLift) {
      setLiftResults([]);
      setSelectedLift(null);
      setLiftId("");
      return;
    }

    const trimmedSearch = liftSearch.trim();

    if (trimmedSearch.length < 2) {
      setLiftResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const results = await searchLifts(trimmedSearch);
        setLiftResults(results);
      } catch (error) {
        console.error(error);
        setLiftResults([]);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [liftSearch, nonJudgedLift]);

  const canSubmit = useMemo(() => {
    if (title.trim().length === 0 || description.trim().length === 0) {
      return false;
    }

    if (nonJudgedLift) {
      return true;
    }

    return (
      liftId.trim().length > 0 &&
      weight.trim().length > 0 &&
      unit.trim().length > 0
    );
  }, [title, description, liftId, weight, unit, nonJudgedLift]);

  useEffect(() => {
    return () => {
      selectedFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [selectedFiles]);

  async function handleFilesChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const processedFiles: SelectedFile[] = [];

    for (const file of files) {
      const kind = getFileKind(file);
      let processedFile = file;

      if (kind === "image") {
        try {
          processedFile = await imageCompression(file, {
            maxSizeMB: 2,
            maxWidthOrHeight: 2000,
            useWebWorker: true,
          });
        } catch (error) {
          console.error("Compression failed:", error);
        }
      }

      const previewUrl = URL.createObjectURL(processedFile);

      processedFiles.push({
        localId: crypto.randomUUID(),
        file: processedFile,
        previewUrl,
        kind,
      });
    }

    setSelectedFiles((prev) => {
      const startIndex = prev.length;
      const next = [...prev, ...processedFiles];

      const firstImageIndex = processedFiles.findIndex(
        (item) => item.kind === "image",
      );

      if (firstImageIndex !== -1) {
        setCropImageSrc(processedFiles[firstImageIndex].previewUrl);
        setEditingIndex(startIndex + firstImageIndex);
      }

      return next;
    });

    event.target.value = "";
  }

  function removeExistingMedia(mediaId: string) {
    setExistingMedia((prev) => prev.filter((m) => m.id !== mediaId));
  }

  function removeFile(indexToRemove: number) {
    setSelectedFiles((prev) => {
      const fileToRemove = prev[indexToRemove];
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }

      return prev.filter((_, index) => index !== indexToRemove);
    });
  }

  function moveExistingMedia(index: number, direction: "left" | "right") {
    setExistingMedia((prev) => {
      const targetIndex = direction === "left" ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const copy = [...prev];
      [copy[index], copy[targetIndex]] = [copy[targetIndex], copy[index]];

      return copy;
    });
  }

  function moveNewFile(index: number, direction: "left" | "right") {
    setSelectedFiles((prev) => {
      const targetIndex = direction === "left" ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const copy = [...prev];
      [copy[index], copy[targetIndex]] = [copy[targetIndex], copy[index]];

      return copy;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || !postId) return;

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      let uploadedMedia: { id: string }[] = [];

      if (selectedFiles.length > 0) {
        uploadedMedia = await uploadMultipleMedia(
          selectedFiles.map((item) => item.file),
          () => MediaPurpose.Post,
        );
      }

      const mediaIds = [
        ...existingMedia.map((m) => m.id),
        ...uploadedMedia.map((m) => m.id),
      ];

      const payload = {
        title: title.trim(),
        description: description.trim(),
        mediaIds,
        liftId: nonJudgedLift ? "019e18eb-688f-7f28-96e9-41ef6ffe44b7" : liftId,
        weight: nonJudgedLift ? null : Number(weight),
        unit: nonJudgedLift ? null : unit,
      };

      await updatePost(postId, payload);

      selectedFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      setSelectedFiles([]);

      router.push(`/post/${postId}`);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update post.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-zinc-400">
        <div className="flex items-center gap-2 text-sm">
          <BiLoaderAlt className="animate-spin" size={20} />
          Loading post...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto min-h-screen w-full max-w-2xl bg-black md:my-8 md:min-h-0 md:rounded-3xl md:shadow-xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-black px-4 py-4 md:rounded-t-3xl">
          <h1 className="text-lg font-semibold text-white">Edit Post</h1>

          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full px-3 py-1.5 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
          >
            Cancel
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6 p-4 md:p-6">
          <section className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="mb-2 flex items-center gap-2 text-sm font-medium text-white"
              >
                <BiText size={18} />
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your post a title"
                maxLength={120}
                className="w-full rounded-2xl border border-gray-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-white"
              />
              <p className="mt-1 text-right text-xs text-gray-400">
                {title.length}/120
              </p>
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 flex items-center gap-2 text-sm font-medium text-white"
              >
                <BiDetail size={18} />
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write something about your PR, workout, or progress..."
                rows={5}
                maxLength={1000}
                className="w-full resize-none rounded-2xl border border-gray-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-white"
              />
              <p className="mt-1 text-right text-xs text-gray-400">
                {description.length}/1000
              </p>
            </div>
          </section>
          <div className="flex items-center justify-between rounded-2xl border border-gray-700 bg-zinc-900 px-4 py-3">
            <div className="pr-4">
              <p className="text-sm font-medium text-white">Non-judged lift</p>

              <p className="text-xs text-gray-400">
                Mark this if the lift cannot be officially verified.
              </p>
            </div>

            <label className="flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={nonJudgedLift}
                onChange={(e) => setNonJudgedLift(e.target.checked)}
                className="peer sr-only"
              />

              <span className="relative h-6 w-11 rounded-full bg-gray-700 transition peer-checked:bg-white peer-checked:[&>span]:translate-x-5">
                <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-black transition-transform duration-200" />
              </span>
            </label>
          </div>

          {!nonJudgedLift && (
            <section className="space-y-4 rounded-2xl border border-gray-800 bg-zinc-950 p-4">
              <div>
                <h2 className="text-sm font-medium text-white">Lift Details</h2>
                <p className="text-xs text-gray-400">
                  Select the lift and enter the weight for this PR.
                </p>
              </div>

              <div className="relative">
                <label
                  htmlFor="lift"
                  className="mb-2 block text-sm font-medium text-white"
                >
                  Lift
                </label>

                <input
                  id="lift"
                  type="text"
                  value={liftSearch}
                  onChange={(e) => {
                    setLiftSearch(e.target.value);
                    setSelectedLift(null);
                    setLiftId("");
                  }}
                  placeholder="Search bench, squat, deadlift..."
                  className="w-full rounded-2xl border border-gray-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-white"
                />

                {liftResults.length > 0 && !selectedLift && (
                  <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-gray-700 bg-zinc-950 shadow-xl">
                    {liftResults.map((lift) => (
                      <button
                        key={lift.id}
                        type="button"
                        onClick={() => {
                          setSelectedLift(lift);
                          setLiftId(lift.id);
                          setLiftSearch(lift.name);
                          setUnit(lift.defaultUnit);
                          setLiftResults([]);
                        }}
                        className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-zinc-900"
                      >
                        <div>
                          <p className="text-sm font-medium text-white">
                            {lift.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {lift.category}
                          </p>
                        </div>

                        <span className="text-xs text-gray-500">
                          {lift.defaultUnit}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label
                    htmlFor="weight"
                    className="mb-2 block text-sm font-medium text-white"
                  >
                    Weight
                  </label>

                  <input
                    id="weight"
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="225"
                    min="0"
                    step="0.5"
                    className="w-full rounded-2xl border border-gray-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="unit"
                    className="mb-2 block text-sm font-medium text-white"
                  >
                    Unit
                  </label>

                  <select
                    id="unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full rounded-2xl border border-gray-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-white"
                  >
                    <option value="">Unit</option>
                    <option value="lb">lb</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>
            </section>
          )}

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-white">Media</h2>
              <span className="text-xs text-gray-400">
                {existingMedia.length + selectedFiles.length} file
                {existingMedia.length + selectedFiles.length === 1 ? "" : "s"}
              </span>
            </div>

            <label
              htmlFor="file-upload"
              className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-700 px-4 py-6 text-white transition hover:border-white hover:bg-zinc-900"
            >
              <BiImageAdd size={24} />
              <span className="text-sm font-medium">Add photos or videos</span>
            </label>

            <input
              id="file-upload"
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFilesChange}
              className="hidden"
            />

            {(existingMedia.length > 0 || selectedFiles.length > 0) && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {existingMedia.map((media, index) => (
                  <div
                    key={media.id}
                    className="relative overflow-hidden rounded-2xl border border-gray-800 bg-zinc-950"
                  >
                    <div className="absolute left-2 top-2 z-10 flex gap-1">
                      <button
                        type="button"
                        onClick={() => moveExistingMedia(index, "left")}
                        disabled={index === 0}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Move media left"
                      >
                        ←
                      </button>

                      <button
                        type="button"
                        onClick={() => moveExistingMedia(index, "right")}
                        disabled={index === existingMedia.length - 1}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Move media right"
                      >
                        →
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeExistingMedia(media.id)}
                      className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
                      aria-label="Remove media"
                    >
                      <BiX size={18} />
                    </button>

                    <div className="aspect-4/5 max-h-90 bg-zinc-900">
                      {media.kind === "Image" ? (
                        <img
                          src={media.url}
                          alt={media.originalFileName ?? "Existing media"}
                          className="h-full w-full object-cover"
                        />
                      ) : media.kind === "Video" ? (
                        <div className="relative h-full w-full">
                          <video
                            src={media.url}
                            className="h-full w-full object-cover"
                            muted
                            playsInline
                          />
                          <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-black/55 px-2 py-2 text-white">
                            <BiVideo size={18} />
                            <span className="truncate text-xs">
                              {media.originalFileName ?? "Video"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                          Media
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-800 px-3 py-2">
                      <p className="truncate text-xs font-medium text-zinc-200">
                        Existing media
                      </p>
                    </div>
                  </div>
                ))}

                {selectedFiles.map((item, index) => (
                  <div
                    key={item.localId}
                    className="relative overflow-hidden rounded-2xl border border-gray-800 bg-zinc-950"
                  >
                    <div className="absolute left-2 top-2 z-10 flex gap-1">
                      <button
                        type="button"
                        onClick={() => moveNewFile(index, "left")}
                        disabled={index === 0}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Move media left"
                      >
                        ←
                      </button>

                      <button
                        type="button"
                        onClick={() => moveNewFile(index, "right")}
                        disabled={index === selectedFiles.length - 1}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Move media right"
                      >
                        →
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
                      aria-label={`Remove ${item.file.name}`}
                    >
                      <BiX size={18} />
                    </button>

                    <div className="aspect-4/5 max-h-90 bg-zinc-900">
                      {item.kind === "image" ? (
                        <img
                          src={item.previewUrl}
                          alt={item.file.name}
                          className="h-full w-full object-cover"
                        />
                      ) : item.kind === "video" ? (
                        <div className="relative h-full w-full">
                          <video
                            src={item.previewUrl}
                            className="h-full w-full object-cover"
                            muted
                            playsInline
                          />
                          <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-black/55 px-2 py-2 text-white">
                            <BiVideo size={18} />
                            <span className="truncate text-xs">
                              {item.file.name}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center p-3 text-center text-zinc-400">
                          <BiDetail size={24} />
                          <span className="mt-2 break-all text-xs">
                            {item.file.name}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-800 px-3 py-2">
                      <p className="truncate text-xs font-medium text-zinc-200">
                        {item.file.name}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        {formatFileSize(item.file.size)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {errorMessage && (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {errorMessage}
            </div>
          )}

          <div className="flex items-center gap-3 pb-6">
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <BiLoaderAlt className="animate-spin" size={18} />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
      {cropImageSrc && editingIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4">
          <div className="relative h-[80vh] w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
            <div className="absolute left-0 right-0 top-0 z-10 border-b border-zinc-800 bg-black/80 px-4 py-3 backdrop-blur">
              <h2 className="text-sm font-semibold text-white">Crop Image</h2>
              <p className="text-xs text-zinc-400">
                Adjust the image before adding it to your post.
              </p>
            </div>

            <div className="absolute inset-0">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={4 / 5}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, croppedPixels) => {
                  setCroppedAreaPixels(croppedPixels);
                }}
              />
            </div>

            <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-zinc-800 bg-black/80 px-4 py-4 backdrop-blur">
              <div className="mb-4">
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Zoom
                </label>

                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-white"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCropImageSrc(null);
                    setEditingIndex(null);
                    setCroppedAreaPixels(null);
                    setCrop({ x: 0, y: 0 });
                    setZoom(1);
                  }}
                  className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (
                      !croppedAreaPixels ||
                      editingIndex === null ||
                      !cropImageSrc
                    ) {
                      return;
                    }

                    const croppedBlob = await getCroppedImg(
                      cropImageSrc,
                      croppedAreaPixels,
                    );

                    const original = selectedFiles[editingIndex];

                    if (!original) return;

                    const croppedFile = new File(
                      [croppedBlob],
                      original.file.name,
                      {
                        type: "image/jpeg",
                      },
                    );

                    const newPreview = URL.createObjectURL(croppedFile);

                    setSelectedFiles((prev) =>
                      prev.map((item, index) => {
                        if (index !== editingIndex) return item;

                        URL.revokeObjectURL(item.previewUrl);

                        return {
                          ...item,
                          file: croppedFile,
                          previewUrl: newPreview,
                        };
                      }),
                    );

                    setCropImageSrc(null);
                    setEditingIndex(null);
                    setCroppedAreaPixels(null);
                    setCrop({ x: 0, y: 0 });
                    setZoom(1);
                  }}
                  className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
