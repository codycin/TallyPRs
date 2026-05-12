import { MediaResponse } from "./media";
export type PostResponse = {
  id: string;
  userId: string;
  userName: string;
  liftId: string;

  title: string;
  description: string;
  profilePictureUrl?: string | null;

  weight: number;
  unit: string;

  status: number; // enum PRstatus

  judgedByAdminID?: string | null;
  judgeNote?: string | null;
  judgedAt?: string | null;

  createdAt: string;

  commentCount: number;
  voteCount: number;

  myVoteValue?: number | null; // enum VoteValue

  media: MediaResponse[];
};

export type CreatePostRequest = {
  title: string;
  description: string;
  mediaIds: string[];
  liftId?: string | null;
  weight?: number | null;
  unit?: string | null;
};

export type VoteRequest = {
  VoteValue: number; // enum VoteValue -1 or 1
};
