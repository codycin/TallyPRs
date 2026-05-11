using TallahasseePRs.Api.Models.Enums;

namespace TallahasseePRs.Api.DTOs.Judging
{
    public sealed class JudgeRequest
    {
        public PRstatus Status { get; set; }
        public string JudgeNote { get; set; } = string.Empty;
    }
}
