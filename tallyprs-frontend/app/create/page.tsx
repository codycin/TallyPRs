"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import {
  BiImageAdd,
  BiVideo,
  BiX,
  BiLoaderAlt,
  BiText,
  BiDetail,
} from "react-icons/bi";

import { uploadMultipleMedia } from "@/services/mediaService";
import { MediaPurpose } from "@/types/media";
import { createPost } from "@/services/Post/posts";

import imageCompression from "browser-image-compression";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/utils/cropImage";

type SelectedFile = {
  localId: string;
  file: File;
  previewUrl: string;
  kind: "image" | "video" | "other";
};

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

export default function CreatePostPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [liftId, setLiftId] = useState("");
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const canSubmit = useMemo(() => {
    return title.trim().length > 0 && description.trim().length > 0;
  }, [title, description]);

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
  function removeFile(indexToRemove: number) {
    setSelectedFiles((prev) => {
      const fileToRemove = prev[indexToRemove];
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }

      return prev.filter((_, index) => index !== indexToRemove);
    });
  }
  function moveFile(index: number, direction: "left" | "right") {
    setSelectedFiles((prev) => {
      const targetIndex = direction === "left" ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= prev.length) {
        return prev;
      }

      const copy = [...prev];
      [copy[index], copy[targetIndex]] = [copy[targetIndex], copy[index]];

      return copy;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

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

      const payload = {
        title: title.trim(),
        description: description.trim(),
        mediaIds: uploadedMedia.map((media) => media.id),
        liftId: null,
        weight: null,
        unit: null,
      };

      console.log("CreatePost payload:", payload);
      console.log("CreatePost JSON:", JSON.stringify(payload));

      await createPost(payload);

      setTitle("");
      setDescription("");

      selectedFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      setSelectedFiles([]);

      alert("Post created successfully.");
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to create post.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto min-h-screen w-full max-w-2xl bg-black md:my-8 md:min-h-0 md:rounded-3xl md:shadow-xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-black px-4 py-4 md:rounded-t-3xl">
          <h1 className="text-lg font-semibold text-white">Create Post</h1>
          <div className="w-10" />
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

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-white">Media</h2>
              <span className="text-xs text-gray-400">
                {selectedFiles.length} file
                {selectedFiles.length === 1 ? "" : "s"}
              </span>
            </div>

            <label
              htmlFor="file-upload"
              className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-700 px-4 py-6 text-white transition hover:border-white hover:bg-zinc-900"
            >
              <BiImageAdd size={24} />
              <span className="text-sm font-medium">
                Choose photos or videos
              </span>
            </label>

            <input
              id="file-upload"
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFilesChange}
              className="hidden"
            />

            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {selectedFiles.map((item, index) => (
                  <div
                    key={item.localId}
                    className="relative overflow-hidden rounded-2xl border border-gray-800 bg-white"
                  >
                    <div className="absolute left-2 top-2 z-10 flex gap-1">
                      <button
                        type="button"
                        onClick={() => moveFile(index, "left")}
                        disabled={index === 0}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Move media left"
                      >
                        ←
                      </button>

                      <button
                        type="button"
                        onClick={() => moveFile(index, "right")}
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

                    <div className="aspect-[4/5] max-h-[360px] bg-gray-100">
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
                        <div className="flex h-full flex-col items-center justify-center p-3 text-center text-gray-600">
                          <BiDetail size={24} />
                          <span className="mt-2 break-all text-xs">
                            {item.file.name}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-200 px-3 py-2">
                      <p className="truncate text-xs font-medium text-gray-800">
                        {item.file.name}
                      </p>
                      <p className="text-[11px] text-gray-500">
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
                  Posting...
                </>
              ) : (
                "Post"
              )}
            </button>
          </div>
        </form>
      </div>
      {cropImageSrc && editingIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="relative h-[80vh] w-full max-w-lg">
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

            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setCropImageSrc(null);
                  setEditingIndex(null);
                }}
                className="rounded-xl bg-gray-700 px-4 py-2 text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (!croppedAreaPixels) return;

                  const croppedBlob = await getCroppedImg(
                    cropImageSrc,
                    croppedAreaPixels,
                  );

                  const original = selectedFiles[editingIndex];

                  const croppedFile = new File(
                    [croppedBlob],
                    original.file.name,
                    {
                      type: "image/jpeg",
                    },
                  );

                  const newPreview = URL.createObjectURL(croppedFile);

                  setSelectedFiles((prev) =>
                    prev.map((item, index) =>
                      index === editingIndex
                        ? {
                            ...item,
                            file: croppedFile,
                            previewUrl: newPreview,
                          }
                        : item,
                    ),
                  );

                  setCropImageSrc(null);
                  setEditingIndex(null);
                }}
                className="rounded-xl bg-white px-4 py-2 text-black"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
