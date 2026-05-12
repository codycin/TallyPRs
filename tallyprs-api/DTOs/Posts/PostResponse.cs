using TallahasseePRs.Api.DTOs.Media;
using TallahasseePRs.Api.Models.Enums;

namespace TallahasseePRs.Api.DTOs.Posts
{
    public class PostResponse
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid? LiftId { get; set; }

        public string Title { get; set; } = "";
        public string UserName { get; set; } = "";
        public string? ProfilePictureUrl { get; set; }
        public string Description { get; set; } = "";

        public decimal? Weight { get; set; } = 0;
        public string? Unit { get; set; } = "lb";

        public PRstatus Status { get; set; }

        public Guid? JudgedByAdminID { get; set; }
        public string? JudgeNote { get; set; }
        public DateTime? JudgedAt { get; set; }

        public DateTime CreatedAt { get; set; }

        // optional extras that clients usually want:
        public int CommentCount { get; set; }
        public int VoteCount { get; set; } 

        public VoteValue? MyVoteValue { get; set; }

        public List<MediaResponse> Media { get; set; } = new();

    }
}
