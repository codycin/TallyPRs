using Microsoft.AspNetCore.Mvc;
using TallahasseePRs.Api.DTOs.Messages;

namespace TallahasseePRs.Api.Services.Conversations
{
    public interface IConversationService
    {
        Task<List<MessageResponse>> GetMessagesForUser(Guid currentUserId, Guid conversationId);
        Task<ConversationResponse> CreateConversationAsync(Guid currentUserId, Guid otherUserID);
    }
}
