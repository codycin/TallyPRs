"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/Notifications/notificationService";
import { NotificationResponse } from "@/types/notification";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationResponse[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    try {
      setLoading(true);
      setError("");

      const data = await getNotifications();

      setNotifications(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load notifications",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(notificationId: string, isRead: boolean) {
    try {
      setUpdatingId(notificationId);

      const updated = await markNotificationRead(notificationId, isRead);

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId ? updated : notification,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update notification",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleMarkAllRead() {
    try {
      setMarkingAll(true);
      setError("");

      await markAllNotificationsRead();

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark all read");
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <section className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="mt-1 text-sm text-gray-600">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                : "You're all caught up."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={markingAll || unreadCount === 0}
            className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {markingAll ? "Updating..." : "Mark all read"}
          </button>
        </div>

        {loading && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
            Loading notifications...
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              No notifications yet
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Comments, replies, follows, and post updates will appear here.
            </p>
          </div>
        )}

        {!loading && notifications.length > 0 && (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                updating={updatingId === notification.id}
                onMarkRead={handleMarkRead}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function NotificationCard({
  notification,
  updating,
  onMarkRead,
}: {
  notification: NotificationResponse;
  updating: boolean;
  onMarkRead: (notificationId: string, isRead: boolean) => Promise<void>;
}) {
  const href = getNotificationHref(notification);

  return (
    <div
      className={[
        "rounded-2xl border p-4 shadow-sm transition",
        notification.isRead
          ? "border-gray-200 bg-white"
          : "border-blue-200 bg-blue-50",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            "mt-2 h-2.5 w-2.5 shrink-0 rounded-full",
            notification.isRead ? "bg-gray-300" : "bg-blue-600",
          ].join(" ")}
        />

        <div className="min-w-0 flex-1">
          <Link
            href={href}
            onClick={() => {
              if (!notification.isRead) {
                void onMarkRead(notification.id, true);
              }
            }}
            className="block text-sm text-gray-900 hover:underline"
          >
            <span className="font-semibold">
              {notification.actorUsername
                ? `@${notification.actorUsername}`
                : "System"}
            </span>{" "}
            <span>{notification.message}</span>
          </Link>

          <p className="mt-1 text-xs text-gray-500">
            {formatNotificationDate(notification.createdAt)}
          </p>
        </div>

        <button
          type="button"
          disabled={updating}
          onClick={() => onMarkRead(notification.id, !notification.isRead)}
          className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {updating
            ? "Updating..."
            : notification.isRead
              ? "Mark unread"
              : "Mark read"}
        </button>
      </div>
    </div>
  );
}

function getNotificationHref(notification: NotificationResponse) {
  if (notification.postId) {
    return `/posts/${notification.postId}`;
  }

  if (notification.actorId) {
    return `/profiles/${notification.actorId}`;
  }

  return "/notifications";
}

function formatNotificationDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
