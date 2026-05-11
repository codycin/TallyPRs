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
        
        public PostService(AppDbContext appDbContext, INotificationService notification, IMediaService mediaService, IObjectStorage storage)
        {
            _db = appDbContext;
            _notificationService = notification;
            _mediaService = mediaService;
            _storage = storage;
        }

        //Create post
        public async Task<PostResponse> CreateAsync(Guid userId, CreatePostRequest request, CancellationToken cancellationToken = default)
        {
            

            var mediaItems = await ValidateAndLoadMediaAsync(userId, request.MediaIds, currentPostId: null, cancellationToken);

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

            return ToResponse(savedPost, commentCount: 0);

        }

        public async Task<PostResponse?> GetByIdAsync(Guid postId)
        {
            //Get the post by ID
            return await _db.Posts
                .Where(p => p.Id == postId)
                .Select(p => new PostResponse //Creates new PostResponse with the selection
                {
                    Id = p.Id,
                    UserId = p.UserId,
                    LiftId = p.LiftId,
                    Title = p.Title,
                    UserName = p.User.UserName,
                    Description = p.Description,
                    Weight = p.Weight,
                    Unit = p.Unit,
                    Status = p.Status,
                    JudgedByAdminID = p.JudgedByAdminID,
                    JudgeNote = p.JudgeNote,
                    JudgedAt = p.JudgedAt,
                    CreatedAt = p.CreatedAt,
                    CommentCount = p.Comments.Count
                })
                .FirstOrDefaultAsync();
        }
        //Update posts
        public async Task<PostResponse?> UpdateAsync(Guid userId, Guid postId, UpdatePostRequest request, CancellationToken cancellationToken = default)
        {
            //Fetch ID and check
            var post = await _db.Posts.FirstOrDefaultAsync(p => p.Id == postId);
            if (post is null) return null;

            // Make sure User is trying to edit post
            if (post.UserId != userId)
                throw new UnauthorizedAccessException("You do not own this post.");

            //Checks that new LiftId infact does exist
            if (request.LiftId.HasValue)
            {
                var liftExists = await _db.Lifts.AnyAsync(l => l.Id == request.LiftId.Value);
                if (!liftExists)
                    throw new InvalidOperationException("LiftId does not exist.");

                post.LiftId = request.LiftId.Value;
            }

            var newMediaItems = await ValidateAndLoadMediaAsync(
                userId,
                request.MediaIds,
                currentPostId: post.Id,
                cancellationToken);


            //Checks if anything else was updated
            if (request.Title is not null) post.Title = request.Title.Trim();
            if (request.Description is not null) post.Description = request.Description.Trim();
            if (request.Weight.HasValue) post.Weight = request.Weight.Value;
            if (request.Unit is not null) post.Unit = string.IsNullOrWhiteSpace(request.Unit) ? post.Unit : request.Unit.Trim();

            var newMediaIds = newMediaItems.Select(m => m.Id).ToHashSet();

            foreach (var existingMedia in post.MediaItems.ToList())
            {
                if (!newMediaIds.Contains(existingMedia.Id))
                {
                    existingMedia.PostId = null;
                    existingMedia.UpdatedAt = DateTime.UtcNow;
                }
            }

            foreach (var media in newMediaItems)
            {
                if (media.PostId != post.Id)
                {
                    media.PostId = post.Id;
                    media.UpdatedAt = DateTime.UtcNow;
                }
            }

            //Save changed to database
            await _db.SaveChangesAsync(cancellationToken);

            var savedPost = await _db.Posts
                .AsNoTracking()
                .Include(p => p.User)
                .Include(p => p.Lift)
                .Include(p => p.MediaItems)
                .FirstAsync(p => p.Id == post.Id, cancellationToken);

            //Saves comment count
            var commentCount = await _db.Comments.CountAsync(c => c.Id == postId); //THIS WAS WEIRD, CHECK AGAIN FOR COMMENT FUNCTION

            return ToResponse(savedPost, commentCount);
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
                await _mediaService.DeleteAsync(m.Id, userId);
            }
            //Removes from database
            _db.Posts.Remove(post);
            //Save changes
            await _db.SaveChangesAsync();
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


            var commentCount = await _db.Comments.CountAsync(c => c.Id == postId); 
            return ToResponse(post, commentCount);


        }

        private PostResponse ToResponse(PRPost p, int commentCount) 
        {
            return new PostResponse
            {
                Id = p.Id,
                UserId = p.UserId,
                LiftId = p.LiftId,
                UserName = p.User.UserName,
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

                 Media = p.MediaItems
                    .Where(m => m.Status == MediaStatus.Ready)
                    .OrderBy(m => m.CreatedAt)
                    .Select(m => new MediaResponse
                    {
                        Id = m.Id,
                        Url = _storage.GetPublicUrl(m.ObjectKey),
                        ThumbnailUrl = m.ThumbnailObjectKey != null
                            ? _storage.GetPublicUrl(m.ThumbnailObjectKey)
                            : null,
                        Kind = m.Kind.ToString(),
                        Purpose = m.Purpose.ToString(),
                        OriginalFileName = m.OriginalFileName,
                        ContentType = m.ContentType,
                        SizeBytes = m.SizeBytes,
                        Width = m.Width,
                        Height = m.Height,
                        DurationSeconds = m.DurationSeconds,
                        CreatedAt = m.CreatedAt
                    })
                    .ToList()
                    };
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
