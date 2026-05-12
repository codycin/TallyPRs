import { NotificationResponse } from "@/types/notification";
import { apiFetch } from "../apiClient";

export async function getNotifications(): Promise<NotificationResponse[]> {
  const response = await apiFetch("/notifications");

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to get notifications");
  }

  return response.json();
}

export async function getUnreadNotificationCount(): Promise<number> {
  const response = await apiFetch("/notifications/unread-count");

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to get unread notification count");
  }

  return response.json();
}

export async function markNotificationRead(
  notificationId: string,
  isRead: boolean = true,
): Promise<NotificationResponse> {
  const response = await apiFetch(`/notifications/${notificationId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ isRead }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to update notification");
  }

  return response.json();
}

export async function markAllNotificationsRead(): Promise<void> {
  const response = await apiFetch("/notifications/read-all", {
    method: "PATCH",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to mark notifications read");
  }
}
