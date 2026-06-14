using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TallahasseePRs.Api.Data;
using TallahasseePRs.Api.DTOs.Messages;
using TallahasseePRs.Api.Models.Messages;
using TallahasseePRs.Api.Services;

namespace TallahasseePRs.Api.Hubs
{
    [Authorize]

    public class MessageHub : Hub
    {
        private readonly AppDbContext _db;
        private readonly CurrentUserService _currentUser;

        public MessageHub(AppDbContext db, CurrentUserService currentUserService)
        {
            _db = db;
            _currentUser = currentUserService;
        }

        public override async Task OnConnectedAsync()
        {
            var currentUserId = _currentUser.GetUserId();

            var conversationIds = await _db.ConversationParticipants
                .Where(x => x.UserId == currentUserId)
                .Select(x => x.ConversationId)
                .ToListAsync();

            foreach (var conversationId in conversationIds)
            {
                await Groups.AddToGroupAsync(
                    Context.ConnectionId,
                    ConversationGroupName(conversationId));
            }

            await base.OnConnectedAsync();
        }

        public async Task JoinConversation(Guid conversationId)
        {
            var currentUserId = _currentUser.GetUserId();

            var isParticipant = await _db.ConversationParticipants.AnyAsync(x =>
                x.ConversationId == conversationId &&
                x.UserId == currentUserId);

            if (!isParticipant)
            {
                throw new HubException("You are not allowed to join this conversation.");
            }

            await Groups.AddToGroupAsync(
                Context.ConnectionId,
                ConversationGroupName(conversationId));
        }

        public async Task SendMessage(Guid conversationId, string body)
        {
            var currentUserId = _currentUser.GetUserId();

            if (string.IsNullOrWhiteSpace(body))
            {
                throw new HubException("Message cannot be empty.");
            }

            var isParticipant = await _db.ConversationParticipants.AnyAsync(x =>
                x.ConversationId == conversationId &&
                x.UserId == currentUserId);
                
             
            if (!isParticipant)
            {
                throw new HubException("You are not allowed to send messages in this conversation.");
            }

            var message = new Message
            {
                ConversationId = conversationId,
                SenderId = currentUserId,
                Body = body.Trim(),
                CreatedAtUtc = DateTime.UtcNow
            };

            _db.Messages.Add(message);
            await _db.SaveChangesAsync();

            var response = new MessageResponse
            {
                Id = message.Id,
                ConversationId = message.ConversationId,
                SenderId = message.SenderId,
                Body = message.Body,
                SentAtUtc = message.CreatedAtUtc
            };

            await Clients
                .Group(ConversationGroupName(conversationId))
                .SendAsync("ReceiveMessage", response);
        }

       
        private static string ConversationGroupName(Guid conversationId)
        {
            return $"conversation-{conversationId}";
        }
    }
    }
