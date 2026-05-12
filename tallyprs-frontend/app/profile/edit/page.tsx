"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { BiImageAdd, BiLoaderAlt, BiUser, BiX } from "react-icons/bi";
import { getProfile, updateProfile } from "@/services/Profile/profile";
import { uploadSingleMedia } from "@/services/mediaService";
import { MediaPurpose } from "@/types/media";
import { UpdateProfileRequest, UserProfileResponse } from "@/types/profile";
import { useRouter } from "next/navigation";

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

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please choose an image file.");
      event.target.value = "";
      return;
    }

    if (selectedFile) {
      URL.revokeObjectURL(selectedFile.previewUrl);
    }

    setSelectedFile({
      file,
      previewUrl: URL.createObjectURL(file),
    });

    setRemoveProfilePicture(false);
    event.target.value = "";
  }

  function handleRemoveSelectedFile() {
    if (selectedFile) {
      URL.revokeObjectURL(selectedFile.previewUrl);
    }

    setSelectedFile(null);
    setRemoveProfilePicture(true);
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
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update profile.",
      );
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
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-gray-700 bg-zinc-900">
                {currentImageUrl ? (
                  <img
                    src={currentImageUrl}
                    alt="Profile preview"
                    className="h-full w-full object-cover"
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
    </main>
  );
}
