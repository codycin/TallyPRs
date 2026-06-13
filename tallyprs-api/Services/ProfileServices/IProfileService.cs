using TallahasseePRs.Api.DTOs.Posts;
using TallahasseePRs.Api.DTOs.Profiles;
using TallahasseePRs.Api.DTOs.Follows;
namespace TallahasseePRs.Api.Services.ProfileServices
{
    public interface IProfileService
    {
        Task<ProfileResponse?> GetByIdAsync(Guid userId);
        Task<ProfileResponse?> UpdateAsync( Guid userId, UpdateProfileRequest request);

        Task<List<FollowUserResponse>> GetFollowingForUserAsync(Guid userId);
        Task<List<FollowUserResponse>> GetFollowersForUserAsync(Guid userId);
    }
    public interface IProfileQueryService
    {
        Task<PublicProfileResponse?> GetPublicByIdAsync(Guid? userId);
    }
}
