import { followUserResponse } from "@/types/follow";
import { useRouter } from "next/navigation";
type UserCardProps = {
  follow: followUserResponse;
  updating: boolean;
  onClicked: (followId: string, isFollowed: boolean) => Promise<void>;
};

export default function UserCard({
  follow,
  updating,
  onClicked,
}: UserCardProps) {
  const router = useRouter();

  return (
    <div
      className="flex items-center justify-between gap-4 p-4 hover:bg-zinc-800 rounded-lg cursor-pointer"
      onClick={() => router.push(`/profile/${follow.userId}`)}
    >
      <p>{follow.displayName}</p>

      <button
        type="button"
        disabled={updating}
        onClick={(e) => {
          e.stopPropagation();
          onClicked(follow.userId, follow.currentUserFollows);
        }}
        className="shrink-0 rounded-full border border-zinc-700 bg-blue-600 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-blue-300 hover:bg-blue-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {updating
          ? "Updating..."
          : follow.currentUserFollows
            ? "Following"
            : follow.isMutual
              ? "Follow back"
              : "follow"}
      </button>
    </div>
  );
}
