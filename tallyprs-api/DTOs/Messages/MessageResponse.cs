namespace TallahasseePRs.Api.DTOs.Messages
{
    public class MessageResponse
    {
        public Guid Id { get; set; }
        public Guid ConversationId { get; set; }
        public Guid SenderId { get; set; }
        public string Body { get; set; } = string.Empty;
        public DateTime SentAtUtc { get; set; }
    }
}
