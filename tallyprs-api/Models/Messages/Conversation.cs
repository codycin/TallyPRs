using System.Xml.Serialization;

namespace TallahasseePRs.Api.Models.Messages
{
    public class Conversation
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

        public List<ConversationParticipant> Participants { get; set; } = new();
        public List<Message> Messages { get; set; } = new();
    }
}
