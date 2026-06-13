using Microsoft.EntityFrameworkCore;
using TallahasseePRs.Api.Common.Paging;
using TallahasseePRs.Api.Data;
using TallahasseePRs.Api.DTOs.Feed;
using TallahasseePRs.Api.DTOs.Media;
using TallahasseePRs.Api.DTOs.Posts;
using TallahasseePRs.Api.Models.Enums;
using TallahasseePRs.Api.Models.Posts;
using TallahasseePRs.Api.Services.PostServices;
using TallahasseePRs.Api.Services.Storage;

namespace TallahasseePRs.Api.Services.FeedServices
{
    public class FeedService : IFeedService
    {
        private readonly AppDbContext _db;
        private readonly ICommentService _commentService;
        private readonly IObjectStorage _storage;

        public FeedService(AppDbContext db, ICommentService commentService, IObjectStorage storage)
        {
            _db = db;
            _commentService = commentService;
            _storage = storage;
        }

        public async Task<FeedPage<PostResponse>> GetFeedAsync(
         FeedQuery query,
         Guid? requestingUser)
        {
            var limit = Math.Clamp(query.Limit, 1, 50);

            IQueryable<PRPost> q = _db.Posts
                .AsNoTracking()
                .Include(p => p.User)
                .Include(p => p.MediaItems);

            // Feed type filter
            q = query.Type switch
            {
                FeedType.Global => q,

                FeedType.Following => q.Where(p =>
                    _db.Follows
                        .Where(f => f.FollowerId == requestingUser)
                        .Select(f => f.FollowedId)
                        .Contains(p.UserId)),

                FeedType.User when query.TargetUserId.HasValue => q.Where(p =>
                    p.UserId == query.TargetUserId.Value),

                FeedType.User => throw new ArgumentException(
                    "TargetUserId is required when FeedType is User."),

                _ => throw new ArgumentOutOfRangeException(
                    nameof(query.Type),
                    query.Type,
                    "Unsupported feed type.")
            };

            // Cursor filter
            if (query.CursorCreatedAt is DateTime cAt && query.CursorId is Guid cId)
            {
                if (cAt.Kind != DateTimeKind.Utc)
                {
                    cAt = DateTime.SpecifyKind(cAt, DateTimeKind.Utc);
                }

                q = q.Where(p =>
                    p.CreatedAt < cAt ||
                    (p.CreatedAt == cAt && p.Id.CompareTo(cId) < 0));
            }

            var posts = await q
                .OrderByDescending(p => p.CreatedAt)
                .ThenByDescending(p => p.Id)
                .Take(limit + 1)
                .ToListAsync();

            var hasMore = posts.Count > limit;
            if (hasMore)
            {
                posts.RemoveAt(posts.Count - 1);
            }

            var postIds = posts.Select(p => p.Id).ToList();

            var commentCounts = await _db.Comments.AsNoTracking()
                .Where(c => postIds.Contains(c.PRPostId))
                .GroupBy(c => c.PRPostId)
                .Select(g => new { PostId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.PostId, x => x.Count);

            var voteCounts = await _db.Votes.AsNoTracking()
                .Where(v => postIds.Contains(v.PRPostId) && v.Value == VoteValue.Up)
                .GroupBy(v => v.PRPostId)
                .Select(g => new { PostId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.PostId, x => x.Count);

            var myVotes = await _db.Votes.AsNoTracking()
                .Where(v => v.UserId == requestingUser && postIds.Contains(v.PRPostId))
                .ToDictionaryAsync(v => v.PRPostId, v => v.Value);

            var userIds = posts
                .Select(p => p.UserId)
                .Distinct()
                .ToList();

            var profilesByUserId = await _db.Profiles
                .AsNoTracking()
                .Include(p => p.ProfilePicture)
                .Where(p => userIds.Contains(p.UserId))
                .ToDictionaryAsync(p => p.UserId);

            var items = new List<PostResponse>(posts.Count);

            foreach (var post in posts)
            {
                commentCounts.TryGetValue(post.Id, out var commentCount);
                voteCounts.TryGetValue(post.Id, out var voteCount);

                VoteValue? myVoteValue = null;
                if (myVotes.TryGetValue(post.Id, out var v))
                {
                    myVoteValue = v;
                }

                items.Add(new PostResponse
                {
                    Id = post.Id,
                    UserId = post.UserId,
                    LiftId = post.LiftId,
                    Title = post.Title,
                    UserName = post.User.UserName,
                    ProfilePictureUrl = profilesByUserId.TryGetValue(post.UserId, out var profile) && profile.ProfilePicture != null
                        ? _storage.GetPublicUrl(profile.ProfilePicture.ObjectKey)
                        : null,
                    Description = post.Description,
                    Media = post.MediaItems
                        .Where(m=> m.Status != Models.MediaStatus.Deleted)
                        .OrderBy(m => m.SortOrder)
                        .ThenBy(m => m.CreatedAt)
                        .Select(ToMediaResponse)
                        .ToList(),
                    Weight = post.Weight,
                    Unit = post.Unit,
                    Status = post.Status,
                    JudgedByAdminID = post.JudgedByAdminID,
                    JudgeNote = post.JudgeNote,
                    JudgedAt = post.JudgedAt,
                    CreatedAt = post.CreatedAt,

                    CommentCount = commentCount,
                    VoteCount = voteCount,
                    MyVoteValue = myVoteValue
                });
            }

            string? nextCursor = null;

            if (hasMore && posts.Count > 0)
            {
                var last = posts[^1];
                nextCursor = CursorCodec.Encode(last.CreatedAt, last.Id);
            }

            return new FeedPage<PostResponse>
            {
                Items = items,
                NextCursor = nextCursor
            };
        }
        private MediaResponse ToMediaResponse(Models.Media media)
        {
            return new MediaResponse
            {
                Id = media.Id,
                Url = media.PlaybackObjectKey == null ? _storage.GetPublicUrl(media.ObjectKey) : _storage.GetPublicUrl(media.PlaybackObjectKey),
                ThumbnailUrl = media.ThumbnailObjectKey != null
                    ? _storage.GetPublicUrl(media.ThumbnailObjectKey)
                    : null,

                Kind = media.Kind.ToString(),
                Purpose = media.Purpose.ToString(),

                OriginalFileName = media.OriginalFileName,
                ContentType = media.PlaybackContentType == null ? media.ContentType : media.PlaybackContentType,
                SizeBytes = media.SizeBytes,

                Width = media.Width,
                Height = media.Height,
                DurationSeconds = media.DurationSeconds,

                CreatedAt = media.CreatedAt
            };
        }
    }
}
