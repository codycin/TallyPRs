using TallahasseePRs.Api.DTOs.Comments;

namespace TallahasseePRs.Api.Services.PostServices
{
    public interface ICommentService
    {
        Task<CommentResponse> CreateTopLevelAsync(Guid postId, Guid UserId, string Body);
        Task<CommentResponse> CreateReplyAsync(Guid postId, Guid ParentCommentId,  Guid UserId, string Body);

        Task<List<CommentResponse>> GetThreadForPostAsync(Guid PostId);

        Task DeleteAsync(Guid CommentID, Guid RequestingUserId, bool IsAdmin);



    }
}
