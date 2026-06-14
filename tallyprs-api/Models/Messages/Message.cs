using TallahasseePRs.Api.Models.Users;

namespace TallahasseePRs.Api.Models.Messages
{
    public class Message
    {
        public Guid Id { get; set; }

        public Guid ConversationId { get; set; }
        public Conversation Conversation { get; set; } = null!;

        public Guid SenderId { get; set; }
        public User Sender { get; set; } = null!;

        public string Body { get; set; } = string.Empty;

        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

        public DateTime? ReadAtUtc { get; set; }
    }
}
