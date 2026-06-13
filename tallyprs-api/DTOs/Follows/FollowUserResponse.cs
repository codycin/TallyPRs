using Amazon.S3.Model;

namespace TallahasseePRs.Api.DTOs.Follows
{
    public sealed class FollowUserResponse
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string DisplayName { get; set; } = string.Empty;
        public bool IsMutual { get; set; }
        public bool CurrentUserFollows { get; set; }
    }
}
