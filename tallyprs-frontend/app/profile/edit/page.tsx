"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { BiImageAdd, BiLoaderAlt, BiUser, BiX } from "react-icons/bi";
import { getProfile, updateProfile } from "@/services/Profile/profile";
import { uploadSingleMedia } from "@/services/mediaService";
import { MediaPurpose } from "@/types/media";
import { UpdateProfileRequest, UserProfileResponse } from "@/types/profile";
import { useRouter } from "next/navigation";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/utils/cropImage";
import { ApiError } from "@/utils/apiError";

type SelectedFile = {
  file: File;
  previewUrl: string;
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const units = ["Bytes", "KB", "MB", "GB"];
  const k = 1024;
  const index = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, index);

  return `${value.toFixed(2)} ${units[index]}`;
}
function isHeicFile(file: File) {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  return (
    name.endsWith(".heic") ||
    name.endsWith(".heif") ||
    type === "image/heic" ||
    type === "image/heif" ||
    type === "image/heic-sequence" ||
    type === "image/heif-sequence"
  );
}

async function convertHeicToJpeg(file: File): Promise<File> {
  if (typeof window === "undefined") {
    throw new Error("HEIC conversion is only available in the browser.");
  }

  const heic2anyModule = await import("heic2any");
  const heic2any = heic2anyModule.default;

  const converted = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.9,
  });

  const blob = Array.isArray(converted) ? converted[0] : converted;

  const newName = file.name.replace(/\.(heic|heif)$/i, ".jpg");

  return new File([blob], newName, {
    type: "image/jpeg",
  });
}

export default function EditProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [homeGym, setHomeGym] = useState("");
  const [lifterType, setLifterType] = useState("");
  const [specialtyLifts, setSpecialtyLifts] = useState("");
  const [measurementsJson, setMeasurementsJson] = useState("");

  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [removeProfilePicture, setRemoveProfilePicture] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return displayName.trim().length > 0;
  }, [displayName]);

  useEffect(() => {
    async function loadProfile() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const data = await getProfile();
        setProfile(data);

        setDisplayName(data.displayName ?? "");
        setHomeGym(data.homeGym ?? "");
        setLifterType(data.lifterType ?? "");
        setSpecialtyLifts(data.specialtyLifts ?? "");
        setMeasurementsJson(data.measurementsJson ?? "");
      } catch (error) {
        console.error(error);
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load profile.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, []);

  useEffect(() => {
    return () => {
      if (selectedFile) {
        URL.revokeObjectURL(selectedFile.previewUrl);
      }
    };
  }, [selectedFile]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    let file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !isHeicFile(file)) {
      setErrorMessage("Please choose an image file.");
      event.target.value = "";
      return;
    }

    try {
      if (isHeicFile(file)) {
        file = await convertHeicToJpeg(file);
      }

      if (selectedFile) {
        URL.revokeObjectURL(selectedFile.previewUrl);
      }

      const previewUrl = URL.createObjectURL(file);

      setSelectedFile({
        file,
        previewUrl,
      });

      setCropImageSrc(previewUrl);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);

      setRemoveProfilePicture(false);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        "Failed to convert HEIC image. Please try JPG, PNG, or WebP.",
      );
    } finally {
      event.target.value = "";
    }
  }

  function handleRemoveSelectedFile() {
    if (selectedFile) {
      URL.revokeObjectURL(selectedFile.previewUrl);
    }

    setSelectedFile(null);
    setCropImageSrc(null);
    setCroppedAreaPixels(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);

    setRemoveProfilePicture(true);
  }
  async function handleApplyCrop() {
    if (!cropImageSrc || !croppedAreaPixels || !selectedFile) return;

    try {
      const croppedBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels);

      const croppedFile = new File([croppedBlob], selectedFile.file.name, {
        type: "image/jpeg",
      });

      const newPreviewUrl = URL.createObjectURL(croppedFile);

      URL.revokeObjectURL(selectedFile.previewUrl);

      setSelectedFile({
        file: croppedFile,
        previewUrl: newPreviewUrl,
      });

      setCropImageSrc(null);
      setCroppedAreaPixels(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to crop image.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || !profile) return;

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      let profilePictureId = profile.profilePicture?.id ?? null;
      let shouldRemoveProfilePicture = removeProfilePicture;

      if (selectedFile) {
        const uploaded = await uploadSingleMedia(
          selectedFile.file,
          MediaPurpose.ProfilePicture,
          {
            profileId: profile.userId,
          },
        );

        profilePictureId = uploaded.id;
        shouldRemoveProfilePicture = false;
      }

      const payload: UpdateProfileRequest = {
        displayName: displayName.trim() || null,
        profilePictureId: shouldRemoveProfilePicture ? null : profilePictureId,
        removeProfilePicture: shouldRemoveProfilePicture,
        homeGym: homeGym.trim() || null,
        lifterType: lifterType.trim() || null,
        specialtyLifts: specialtyLifts.trim() || null,
        measurementsJson: measurementsJson.trim() || null,
      };

      const updated = await updateProfile(payload);
      setProfile(updated);

      setDisplayName(updated.displayName ?? "");
      setHomeGym(updated.homeGym ?? "");
      setLifterType(updated.lifterType ?? "");
      setSpecialtyLifts(updated.specialtyLifts ?? "");
      setMeasurementsJson(updated.measurementsJson ?? "");

      if (selectedFile) {
        URL.revokeObjectURL(selectedFile.previewUrl);
      }

      setSelectedFile(null);
      setRemoveProfilePicture(false);

      router.push("/profile");
      router.refresh();
    } catch (error) {
      console.error(error);
      if (error instanceof ApiError && error.status === 403) {
        setErrorMessage("You do not have permission to update this profile.");
        return;
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const currentImageUrl =
    selectedFile?.previewUrl ??
    (!removeProfilePicture ? profile?.profilePicture?.url : null) ??
    null;

  if (isLoading) {
    return (
      <main className="min-h-screen bg-black text-white p-6">
        <div className="mx-auto max-w-2xl">Loading profile...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto min-h-screen w-full max-w-2xl bg-black md:my-8 md:min-h-0 md:rounded-3xl md:shadow-xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-black px-4 py-4 md:rounded-t-3xl">
          <h1 className="text-lg font-semibold text-white">Edit Profile</h1>
          <div className="w-10" />
        </header>

        <form onSubmit={handleSubmit} className="space-y-6 p-4 md:p-6">
          <section className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-700 bg-zinc-900">
                {currentImageUrl ? (
                  <img
                    src={currentImageUrl}
                    alt="Profile preview"
                    className="block h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <BiUser size={40} className="text-gray-400" />
                )}
              </div>

              <label
                htmlFor="profile-picture-upload"
                className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-gray-700 px-4 py-3 text-sm font-medium text-white transition hover:border-white hover:bg-zinc-900"
              >
                <BiImageAdd size={18} />
                Choose profile picture
              </label>

              <input
                id="profile-picture-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {(selectedFile || profile?.profilePicture) &&
                !removeProfilePicture && (
                  <button
                    type="button"
                    onClick={handleRemoveSelectedFile}
                    className="inline-flex items-center gap-2 rounded-2xl border border-red-500/40 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/10"
                  >
                    <BiX size={18} />
                    Remove profile picture
                  </button>
                )}

              {selectedFile && (
                <p className="text-xs text-gray-400">
                  {selectedFile.file.name} ·{" "}
                  {formatFileSize(selectedFile.file.size)}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="displayName"
                className="mb-2 block text-sm font-medium text-white"
              >
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={60}
                className="w-full rounded-2xl border border-gray-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-white"
              />
            </div>

            <div>
              <label
                htmlFor="homeGym"
                className="mb-2 block text-sm font-medium text-white"
              >
                Home Gym
              </label>
              <input
                id="homeGym"
                type="text"
                value={homeGym}
                onChange={(e) => setHomeGym(e.target.value)}
                maxLength={100}
                className="w-full rounded-2xl border border-gray-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-white"
              />
            </div>

            <div>
              <label
                htmlFor="lifterType"
                className="mb-2 block text-sm font-medium text-white"
              >
                Lifter Type
              </label>
              <input
                id="lifterType"
                type="text"
                value={lifterType}
                onChange={(e) => setLifterType(e.target.value)}
                maxLength={100}
                className="w-full rounded-2xl border border-gray-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-white"
              />
            </div>

            <div>
              <label
                htmlFor="specialtyLifts"
                className="mb-2 block text-sm font-medium text-white"
              >
                Specialty Lifts
              </label>
              <input
                id="specialtyLifts"
                type="text"
                value={specialtyLifts}
                onChange={(e) => setSpecialtyLifts(e.target.value)}
                maxLength={150}
                className="w-full rounded-2xl border border-gray-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-white"
              />
            </div>

            <div>
              <label
                htmlFor="measurementsJson"
                className="mb-2 block text-sm font-medium text-white"
              >
                Measurements JSON
              </label>
              <textarea
                id="measurementsJson"
                value={measurementsJson}
                onChange={(e) => setMeasurementsJson(e.target.value)}
                rows={5}
                className="w-full resize-none rounded-2xl border border-gray-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-white"
              />
            </div>
          </section>

          {errorMessage && (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {errorMessage}
            </div>
          )}

          <div className="flex items-center gap-3 pb-6">
            <button
              type="button"
              onClick={() => router.push("/profile")}
              disabled={isSubmitting}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-700 bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

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
                "Save Profile"
              )}
            </button>
          </div>
        </form>
      </div>
      {cropImageSrc && selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4">
          <div className="relative h-[80vh] w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
            <div className="absolute left-0 right-0 top-0 z-10 border-b border-zinc-800 bg-black/80 px-4 py-3 backdrop-blur">
              <h2 className="text-sm font-semibold text-white">
                Crop Profile Picture
              </h2>
              <p className="text-xs text-zinc-400">
                Adjust the image to fit your profile circle.
              </p>
            </div>

            <div className="absolute inset-0">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
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
                  onClick={handleApplyCrop}
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
