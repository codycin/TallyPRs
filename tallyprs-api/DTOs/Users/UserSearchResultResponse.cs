using TallahasseePRs.Api.DTOs.Media;

namespace TallahasseePRs.Api.DTOs.Users
{
    public sealed class UserSearchResultResponse
    {
        public Guid UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;

        public Guid? ProfilePictureId { get; set; }
        public string? ProfilePictureUrl { get; set; }

        public bool IsFollowing { get; set; }
    }
}
