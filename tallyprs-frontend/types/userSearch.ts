export type UserSearchResult = {
  userId: string;
  userName: string;
  displayName: string;
  profilePictureId?: string | null;
  profilePictureUrl?: string | null;
  isFollowing: boolean;
};
