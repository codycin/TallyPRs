using TallahasseePRs.Api.DTOs.Judging;
using TallahasseePRs.Api.DTOs.Posts;
using TallahasseePRs.Api.Models.Enums;

namespace TallahasseePRs.Api.Services.PostServices
{
    //Defines what posts can do.
    public interface IPostService
    {
        Task<PostResponse> CreateAsync(Guid userId, CreatePostRequest request, CancellationToken cancellationToken = default);
        Task<PostResponse?> GetByIdAsync(Guid postId);
        Task<PostResponse?> UpdateAsync(Guid userId, Guid postId, UpdatePostRequest request, CancellationToken cancellationToken = default);
        Task<bool> DeleteAsync(Guid userId, Guid postId, bool isAdmin);
        Task<bool> DeleteAsAdminAsync(Guid userId, Guid postId, string? comment);


        Task<PostResponse?> JudgeAsync(Guid postId, JudgeRequest request, Guid judgeUserId);


    }
}
