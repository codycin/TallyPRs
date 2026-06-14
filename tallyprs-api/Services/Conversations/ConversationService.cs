using Azure.Core;
using Microsoft.EntityFrameworkCore;
using TallahasseePRs.Api.Data;
using TallahasseePRs.Api.DTOs.Messages;
using TallahasseePRs.Api.Models.Messages;
using TallahasseePRs.Api.Services.Notifications;

namespace TallahasseePRs.Api.Services.Conversations
{
    public class ConversationService : IConversationService
    {
        private readonly AppDbContext _db;
        private readonly INotificationService _notificationService;
        public ConversationService(AppDbContext appDbContext, INotificationService notificationService)
        {
            _db = appDbContext;
            _notificationService = notificationService;
        }
        public async Task<List<MessageResponse>> GetMessagesForUser(Guid currentUserId, Guid conversationId)
        {
            var isParticipant = await _db.ConversationParticipants.AnyAsync(x =>
               x.ConversationId == conversationId &&
               x.UserId == currentUserId);

            if (!isParticipant)
            {
                throw new InvalidOperationException("Not a participant");
            }

            var messages = await _db.Messages
                .AsNoTracking()
                .Where(x => x.ConversationId == conversationId)
                .OrderBy(x => x.CreatedAtUtc)
                .Select(x => new MessageResponse
                {
                    Id = x.Id,
                    ConversationId = x.ConversationId,
                    SenderId = x.SenderId,
                    Body = x.Body,
                    SentAtUtc = x.CreatedAtUtc
                })
                .ToListAsync();

            return messages;
        }

        public async Task<ConversationResponse> CreateConversationAsync(Guid currentUserId, Guid otherUserId)
        {
            if (otherUserId == currentUserId)
            {
                throw new InvalidOperationException("Cannot Conversate with Self");

            }

            var otherUserExists = await _db.Profiles.AnyAsync(x =>
                x.UserId == otherUserId);

            if (!otherUserExists)
            {
                throw new InvalidOperationException("User not found.");

            }

            var existingConversationId = await _db.ConversationParticipants
                .Where(x => x.UserId == currentUserId || x.UserId == otherUserId)
                .GroupBy(x => x.ConversationId)
                .Where(g =>
                    g.Count() == 2 &&
                    g.Any(x => x.UserId == currentUserId) &&
                    g.Any(x => x.UserId == otherUserId))
                .Select(g => g.Key)
                .FirstOrDefaultAsync();

            if (existingConversationId != Guid.Empty)
            {
                var existingConversation = await _db.Conversations
                    .AsNoTracking()
                    .Where(x => x.Id == existingConversationId)
                    .Select(x => new ConversationResponse
                    {
                        Id = x.Id,
                        CreatedAtUtc = x.CreatedAtUtc
                    })
                    .FirstAsync();

                return new ConversationResponse
                {
                    Id = existingConversation.Id,
                    CreatedAtUtc = existingConversation.CreatedAtUtc
                };

            }

            var conversation = new Conversation
            {
                Id = Guid.NewGuid(),
                CreatedAtUtc = DateTime.UtcNow,
                Participants = new List<ConversationParticipant>
            {
                new ConversationParticipant
                {
                    UserId = currentUserId
                },
                new ConversationParticipant
                {
                    UserId = otherUserId
                }
            }
            };

            _db.Conversations.Add(conversation);
            await _db.SaveChangesAsync();

            return new ConversationResponse
            {
                Id = conversation.Id,
                CreatedAtUtc = conversation.CreatedAtUtc
            };

        }

    }
}
