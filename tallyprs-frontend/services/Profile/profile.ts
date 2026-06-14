import {
  PublicProfileResponse,
  UpdateProfileRequest,
  UserProfileResponse,
} from "@/types/profile";
import { followUserResponse } from "@/types/follow";
import { apiFetch } from "../apiClient";

export async function getProfile(): Promise<UserProfileResponse> {
  const response = await apiFetch("/me/UserProfile", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `API Error Status: ${response.status} ${response.statusText}`,
    );
    console.error(`API Error Details: ${errorText}`);
    throw new Error(`API failed with status ${response.status}`);
  }

  return response.json();
}

export async function getFollowing(
  userId?: string,
): Promise<followUserResponse[]> {
  let response;

  if (!userId) {
    response = await apiFetch("/me/UserProfile/Following", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
  } else {
    response = await apiFetch(`/profiles/${userId}/Following`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `API Error Status: ${response.status} ${response.statusText}`,
    );
    console.error(`API Error Details: ${errorText}`);
    throw new Error(`API failed with status ${response.status}`);
  }

  return response.json();
}

export async function getFollowers(
  userId?: string,
): Promise<followUserResponse[]> {
  let response;
  if (!userId) {
    response = await apiFetch("/me/UserProfile/Follower", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
  } else {
    console.log("hist");
    response = await apiFetch(`/profiles/${userId}/Follower`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `API Error Status: ${response.status} ${response.statusText}`,
    );
    console.error(`API Error Details: ${errorText}`);
    throw new Error(`API failed with status ${response.status}`);
  }

  return response.json();
}

export async function getPublicProfile(request: {
  userId: string;
}): Promise<PublicProfileResponse> {
  const response = await apiFetch(`/profiles/${request.userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `API Error Status: ${response.status} ${response.statusText}`,
    );
    console.error(`API Error Details: ${errorText}`);
    throw new Error(`API failed with status ${response.status}`);
  }

  return response.json();
}

export async function updateProfile(
  request: UpdateProfileRequest,
): Promise<UserProfileResponse> {
  const response = await apiFetch("/me/UserProfile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `API Error Status: ${response.status} ${response.statusText}`,
    );
    console.error(`API Error Details: ${errorText}`);

    throw new Error(`API failed with status ${response.status}`);
  }

  return response.json();
}
