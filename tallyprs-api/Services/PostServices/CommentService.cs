using Azure.Core;
using Microsoft.AspNetCore.Authentication.BearerToken;
using Microsoft.EntityFrameworkCore;
using System.Numerics;
using TallahasseePRs.Api.Data;
using TallahasseePRs.Api.DTOs.Comments;
using TallahasseePRs.Api.Models.Enums;
using TallahasseePRs.Api.Models.Posts;
using TallahasseePRs.Api.Models.Users;
using TallahasseePRs.Api.Services.Notifications;

namespace TallahasseePRs.Api.Services.PostServices
{
    public sealed class CommentService : ICommentService
    {
        private readonly AppDbContext _db;
        private readonly INotificationService _notificationService;

        public CommentService(AppDbContext db, INotificationService notificationService)
        {
            _db = db;
            _notificationService = notificationService;
        }

        public async Task<CommentResponse> CreateTopLevelAsync(Guid postId, Guid userId, string body)
        {
            var post = await _db.Posts.FirstOrDefaultAsync(p => p.Id == postId );
            if (post is null)
            {
                throw new KeyNotFoundException("Post not found");
            }
            var user = await _db.Profiles.FirstAsync(u => u.UserId == userId);
            var userName = user.DisplayName;
            if (userName.IsWhiteSpace())
                userName = "user-" + userId.ToString();

            var comment = new Comment
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                PRPostId = postId,
                body = body.Trim(),
                ParentCommentId = null,
                UserName = userName,
            };

            _db.Comments.Add(comment);
            await _db.SaveChangesAsync();

            await _notificationService.CreateAsync(
                recipientId: post.UserId,
                actorId: userId,
                type: NotificationType.Comment,
                message: $"{userName} commented on your post"
            );

            return ToResponse(comment, replies: new List<CommentResponse>());

        }

        public async Task<CommentResponse> CreateReplyAsync(Guid postId, Guid parentCommentId, Guid userId, string body)
        {
            var parent = await _db.Comments
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == parentCommentId);
            if (parent == null)
            {
                throw new KeyNotFoundException("Parent comment not found.");
            }
            var parentExists = await _db.Comments.AnyAsync(c => c.Id == parentCommentId);

            var user = await _db.Profiles.FirstAsync(u => u.UserId == userId);
            var userName = user.DisplayName;
            if (userName.IsWhiteSpace())
                userName = "user-"+ userId.ToString();
            if (parent.PRPostId != postId)
                throw new InvalidOperationException("Parent comment does not belong to this post.");

            var comment = new Comment
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                PRPostId = parent.PRPostId,
                body = body.Trim(),
                ParentCommentId = parentCommentId,
                UserName = userName,
            };

            _db.Comments.Add(comment);
            await _db.SaveChangesAsync();

            await _notificationService.CreateAsync(
                recipientId: parent.UserId,
                actorId: userId,
                type: NotificationType.Comment,
                message: $"{userName} replied to your comment"
            );

            return ToResponse(comment, replies: new List<CommentResponse>());
        }

        public async Task<List<CommentResponse>> GetThreadForPostAsync(Guid postId)
        {
            var comments = await _db.Comments.AsNoTracking().Where(c => c.PRPostId == postId).OrderBy(c => c.CreatedAt).ToListAsync();

            var map = comments.ToDictionary(c => c.Id, c => new CommentResponse(
                    Id: c.Id,
                    PostId: c.PRPostId,
                    UserId: c.UserId,
                    UserName: c.UserName,
                    Body: c.body,
                    CreatedAt: c.CreatedAt,
                    ParentCommentId: c.ParentCommentId,
                    Replies: new List<CommentResponse>()
                )
                
            );

            // Build tree
            var roots = new List<CommentResponse>();

            foreach (var c in comments)
            {
                var node = map[c.Id];

                if (c.ParentCommentId is null)
                {
                    roots.Add(node);
                    continue;
                }

                if (map.TryGetValue(c.ParentCommentId.Value, out var parent))
                {
                    parent.Replies.Add(node);
                }
                else
                {
                    // orphan fallback
                    roots.Add(node);
                }
            }

            return roots;
        }

        public async Task DeleteAsync(Guid commentId, Guid requestingUserId, bool isAdmin)
        {
            var comment = await _db.Comments.FirstOrDefaultAsync(c => c.Id == commentId);
            if (comment is null) throw new KeyNotFoundException("Comment not found.");

            if (comment.UserId != requestingUserId && !isAdmin)
                throw new UnauthorizedAccessException("You can only delete your own comments.");

            _db.Comments.Remove(comment);
            await _db.SaveChangesAsync();


        }

        private static CommentResponse ToResponse(Comment c, List<CommentResponse> replies) =>
        new(
            Id: c.Id,
            PostId: c.PRPostId,
            UserId: c.UserId,
            UserName: c.UserName,
            Body: c.body,
            CreatedAt: c.CreatedAt,
            ParentCommentId: c.ParentCommentId,
            Replies: replies
        );
    }
}
