using TallahasseePRs.Api.DTOs.Users;

namespace TallahasseePRs.Api.Services
{
    public interface IUserSearchService
    {
        Task<List<UserSearchResultResponse>> SearchUsersAsync(
            Guid currentUserId,
            string query,
            int take,
            CancellationToken cancellationToken = default);
    }
}
