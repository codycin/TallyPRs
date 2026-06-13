using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client.Extensions.Msal;
using System.Numerics;
using TallahasseePRs.Api.Data;
using TallahasseePRs.Api.DTOs.Judging;
using TallahasseePRs.Api.DTOs.Media;
using TallahasseePRs.Api.DTOs.Posts;
using TallahasseePRs.Api.Models;
using TallahasseePRs.Api.Models.Enums;
using TallahasseePRs.Api.Models.Posts;
using TallahasseePRs.Api.Services.Media;

using TallahasseePRs.Api.Services.Notifications;
using TallahasseePRs.Api.Services.Storage;

namespace TallahasseePRs.Api.Services.PostServices
{
    public sealed class PostService : IPostService
    {
        private readonly AppDbContext _db;
        private readonly INotificationService _notificationService;
        private readonly IMediaService _mediaService;
        private readonly IObjectStorage _storage;
        private readonly ICurrentUserService _currentUser;
        
        public PostService(AppDbContext appDbContext, INotificationService notification, IMediaService mediaService, IObjectStorage storage, ICurrentUserService current)
        {
            _db = appDbContext;
            _notificationService = notification;
            _mediaService = mediaService;
            _storage = storage;
            _currentUser = current;
        }

        //Create post
        public async Task<PostResponse> CreateAsync(Guid userId, CreatePostRequest request, CancellationToken cancellationToken = default)
        {
            

            var mediaItems = await ValidateAndLoadMediaAsync(userId, request.MediaIds, currentPostId: null, cancellationToken);

            if(request.LiftId != null)
            {
                var liftExists = await _db.Lifts
                    .AnyAsync(l => l.Id == request.LiftId.Value, cancellationToken);

                if (!liftExists)
                    throw new InvalidOperationException("LiftId does not exist.");
            }
            

            //Now we create the new post
            var post = new PRPost
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                LiftId = request.LiftId,

                Title = request.Title.Trim(),
                Description = request.Description.Trim(),

                Weight = request.Weight,
                Unit = string.IsNullOrWhiteSpace(request.Unit) ? "lb" : request.Unit.Trim(),

                Status = PRstatus.Pending,
                CreatedAt = DateTime.UtcNow,
            };

            //Now we have to actually add it to database with this pattern
            _db.Posts.Add(post);

            foreach(var media in mediaItems)
            {
                media.PostId = post.Id;
                media.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync(cancellationToken);

            var savedPost = await _db.Posts
                .AsNoTracking()
                .Include(p => p.User)
                .Include(p => p.Lift)
                .Include(p => p.MediaItems)
                .FirstAsync(p => p.Id == post.Id, cancellationToken);

            var profilePictureUrl = await GetProfilePictureUrlAsync(userId, cancellationToken);

            return ToResponse(
                savedPost,
                commentCount: 0,
                voteCount: 0,
                myVoteValue: null,
                profilePictureUrl: profilePictureUrl);

        }

        public async Task<PostResponse?> GetByIdAsync(Guid postId)
        {
            
            var post = await _db.Posts
                .AsNoTracking()
                .Include(p => p.User)
                .Include(p => p.MediaItems)
                .FirstOrDefaultAsync(p => p.Id == postId);

            if (post is null)
                return null;

            var commentCount = await _db.Comments
                .AsNoTracking()
                .CountAsync(c => c.PRPostId == postId);

            var voteCount = await _db.Votes
                .AsNoTracking()
                .Where(v => v.PRPostId == postId && v.Value == VoteValue.Up)
                .CountAsync();

            var userId = _currentUser.UserId;

            var myVoteValue = await _db.Votes
                .AsNoTracking()
                .Where(v => v.PRPostId == postId && v.UserId == userId)
                .Select(v => (VoteValue?)v.Value)
                .FirstOrDefaultAsync();

            var profilePictureUrl = await GetProfilePictureUrlAsync(post.UserId);

            return ToResponse(
                post,
                commentCount,
                voteCount,
                myVoteValue: myVoteValue,
                profilePictureUrl: profilePictureUrl);
        }
        //Update posts
        public async Task<PostResponse?> UpdateAsync(
    Guid userId,
    Guid postId,
    UpdatePostRequest request,
    CancellationToken cancellationToken = default)
        {
            var post = await _db.Posts
                .Include(p => p.MediaItems)
                .FirstOrDefaultAsync(p => p.Id == postId, cancellationToken);

            if (post is null)
                return null;

            if (post.UserId != userId)
                throw new UnauthorizedAccessException("You do not own this post.");

            if (request.LiftId.HasValue)
            {
                var liftExists = await _db.Lifts
                    .AnyAsync(l => l.Id == request.LiftId.Value, cancellationToken);

                if (!liftExists)
                    throw new InvalidOperationException("LiftId does not exist.");

                post.LiftId = request.LiftId.Value;
            }

            var requestedMediaIds = request.MediaIds
                .Where(id => id != Guid.Empty)
                .Distinct()
                .ToList();

            var newMediaItems = await ValidateAndLoadMediaAsync(
                userId,
                requestedMediaIds,
                currentPostId: post.Id,
                cancellationToken);

            if (request.Title is not null)
                post.Title = request.Title.Trim();

            if (request.Description is not null)
                post.Description = request.Description.Trim();

            
            post.Weight = request.Weight;

            if (request.Unit is not null)
                post.Unit = string.IsNullOrWhiteSpace(request.Unit)
                    ? post.Unit
                    : request.Unit.Trim();

            var newMediaIds = newMediaItems
                .Select(m => m.Id)
                .ToHashSet();

            var mediaOrder = requestedMediaIds
                .Select((id, index) => new { id, index })
                .ToDictionary(x => x.id, x => x.index);

            foreach (var existingMedia in post.MediaItems.ToList())
            {
                if (!newMediaIds.Contains(existingMedia.Id))
                {
                    await _mediaService.DeleteAsync(existingMedia.Id, userId, isAdmin: false);

                }
            }

            foreach (var media in newMediaItems)
            {
                media.PostId = post.Id;
                media.SortOrder = mediaOrder[media.Id];
                media.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync(cancellationToken);

            var savedPost = await _db.Posts
                .AsNoTracking()
                .Include(p => p.User)
                .Include(p => p.Lift)
                .Include(p => p.MediaItems)
                .FirstAsync(p => p.Id == post.Id, cancellationToken);

            var commentCount = await _db.Comments
                .AsNoTracking()
                .CountAsync(c => c.PRPostId == postId, cancellationToken);

            var profilePictureUrl = await GetProfilePictureUrlAsync(userId, cancellationToken);

            var voteCount = await _db.Votes
                .AsNoTracking()
                .Where(v => v.PRPostId == postId && v.Value == VoteValue.Up)
                .CountAsync(cancellationToken);

            return ToResponse(
                savedPost,
                commentCount,
                voteCount,
                profilePictureUrl: profilePictureUrl);
        }
        public async Task<bool> DeleteAsync(Guid userId, Guid postId, bool isAdmin)
        {
            //Fetches post and makes sure it exists
            var post = await _db.Posts.Include(p => p.MediaItems).FirstOrDefaultAsync(p => p.Id == postId);
            
            if (post is null) return false;

            //Makes sure owner is owner
            if ((post.UserId != userId) && !isAdmin)
                throw new UnauthorizedAccessException("You do not own this post.");

            //Delete media associated with it
            foreach(var m in post.MediaItems)
            {
                await _mediaService.DeleteAsync(m.Id, userId, isAdmin);
            }
            //Removes from database
            _db.Posts.Remove(post);
            //Save changes
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsAdminAsync(Guid userId, Guid postId, string? comment)
        {
            //Fetches post and makes sure it exists
            var post = await _db.Posts.Include(p => p.MediaItems).FirstOrDefaultAsync(p => p.Id == postId);

            if (post is null) return false;

            //Delete media associated with it
            foreach (var m in post.MediaItems)
            {
                await _mediaService.DeleteAsync(m.Id, userId, true);
            }
            //Removes from database
            _db.Posts.Remove(post);
            //Save changes
            await _db.SaveChangesAsync();

            //Send notification
            await _notificationService.CreateAsync(
                recipientId: post.UserId,
                actorId: userId,
                type: NotificationType.PostDeletedByAdmin,
                message: $"Your post '{post.Title}' was deleted by an administrator. Reason: {comment ?? "No reason provided."}"
            );

            return true;
        }

        public async Task<PostResponse?> JudgeAsync(Guid postId, JudgeRequest request, Guid judgeUserId)
        {
            var post = await _db.Posts
                .Include(p => p.User)
                .Include(p => p.MediaItems)
                .FirstOrDefaultAsync(p => p.Id == postId);
            if (post == null) return null;
            var targetUserId = post.UserId;
            var approval = request.Status == PRstatus.Approved ? NotificationType.PostApproved : NotificationType.PostRejected;

            post.Status = request.Status;
            post.JudgeNote = request.JudgeNote;
            post.JudgedAt = DateTime.UtcNow;
            post.JudgedByAdminID = judgeUserId;

            await _db.SaveChangesAsync();

            await _notificationService.CreateAsync(
                recipientId: targetUserId,
                actorId: judgeUserId,
                type: approval,
                message: approval == NotificationType.PostApproved ? $"Post:{post.Id} has been approved" : $"Post:{post.Id} has been rejected"
            );


            var commentCount = await _db.Comments
                .CountAsync(c => c.PRPostId == postId);

            var profilePictureUrl = await GetProfilePictureUrlAsync(post.UserId);
            var voteCount = await _db.Votes
                .AsNoTracking()
                .Where(v => v.PRPostId == postId && v.Value == VoteValue.Up)
                .CountAsync();

            return ToResponse(
                 post,
                 commentCount,
                 voteCount);


        }

        private PostResponse ToResponse(
           PRPost p,
           int commentCount,
           int voteCount = 0,
           VoteValue? myVoteValue = null,
           string? profilePictureUrl = null)
        {
            return new PostResponse
            {
                Id = p.Id,
                UserId = p.UserId,
                LiftId = p.LiftId,

                UserName = p.User.UserName ?? "",
                ProfilePictureUrl = profilePictureUrl,

                Title = p.Title,
                Description = p.Description,
                Weight = p.Weight,
                Unit = p.Unit,
                Status = p.Status,
                JudgedByAdminID = p.JudgedByAdminID,
                JudgeNote = p.JudgeNote,
                JudgedAt = p.JudgedAt,
                CreatedAt = p.CreatedAt,

                CommentCount = commentCount,
                VoteCount = voteCount,
                MyVoteValue = myVoteValue,

                Media = p.MediaItems
                    .Where(m => m.Status == MediaStatus.Ready)
                    .OrderBy(m => m.SortOrder)
                    .ThenBy(m => m.CreatedAt)
                    .Select(m => new MediaResponse
                    {
                        Id = m.Id,
                        Url = _storage.GetPublicUrl(m.PlaybackObjectKey == null ? m.ObjectKey : m.PlaybackObjectKey),
                        ThumbnailUrl = m.ThumbnailObjectKey != null
                            ? _storage.GetPublicUrl(m.ThumbnailObjectKey)
                            : null,
                        Kind = m.Kind.ToString(),
                        Purpose = m.Purpose.ToString(),
                        OriginalFileName = m.OriginalFileName,
                        ContentType = (m.PlaybackContentType == null ? m.ContentType : m.PlaybackContentType),
                        SizeBytes = m.SizeBytes,
                        Width = m.Width,
                        Height = m.Height,
                        DurationSeconds = m.DurationSeconds,
                        CreatedAt = m.CreatedAt
                    })
                    .ToList()
            };
        }

        private async Task<string?> GetProfilePictureUrlAsync(
            Guid userId,
            CancellationToken cancellationToken = default)
        {
            var profile = await _db.Profiles
                .AsNoTracking()
                .Include(p => p.ProfilePicture)
                .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

            return profile?.ProfilePicture != null
                ? _storage.GetPublicUrl(profile.ProfilePicture.ObjectKey)
                : null;
        }

        private async Task<List<Models.Media>> ValidateAndLoadMediaAsync(
            Guid userId,
            IEnumerable<Guid> mediaIds,
            Guid? currentPostId,
            CancellationToken cancellationToken)
        {
            var distinctIds = mediaIds
                .Where(id => id != Guid.Empty)
                .Distinct()
                .ToList();

            if (distinctIds.Count == 0)
                return new List<Models.Media>();

            var mediaItems = await _db.Media
                .Where(m => distinctIds.Contains(m.Id))
                .ToListAsync(cancellationToken);

            if (mediaItems.Count != distinctIds.Count)
                throw new InvalidOperationException("One or more media items were not found.");

            foreach (var media in mediaItems)
            {
                if (media.OwnerId != userId)
                    throw new InvalidOperationException("You can only attach your own media.");

                if (media.Status != MediaStatus.Ready)
                    throw new InvalidOperationException("Only ready media can be attached to a post.");

                if (media.Purpose != MediaPurpose.Post)
                    throw new InvalidOperationException("Only post media can be attached to a post.");

                if (media.PostId.HasValue && media.PostId != currentPostId)
                    throw new InvalidOperationException("One or more media items are already attached to another post.");
            }

            return mediaItems;
        }
    }

}
