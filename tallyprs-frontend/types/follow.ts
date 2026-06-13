export type followResponse = {
  Id: string;
  FollowerId: string;
  FollowedId: string;
  FollowedAt: Date;
};

export type followUserResponse = {
  id: string;
  userId: string;
  displayName: string;
  currentUserFollows: boolean;
  isMutual: boolean;
};

export type followRequest = {
  FollowedId: string;
};
