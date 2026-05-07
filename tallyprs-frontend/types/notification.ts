export enum NotificationType {
  Follow = 1,
  UpVote = 2,
  Comment = 3,
  PostApproved = 4,
  PostRejected = 5,
}
export type NotificationResponse = {
  id: string;
  type: number;
  message: string;
  isRead: boolean;
  createdAt: string;
  actorId?: string | null;
  actorUsername?: string | null;
  postId?: string | null;
  commentId?: string | null;
};

export type NotificationReadRequest = {
  isRead: boolean;
};
