using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client.Extensions.Msal;
using TallahasseePRs.Api.Data;
using TallahasseePRs.Api.DTOs.Users;
using TallahasseePRs.Api.Services.Storage;

namespace TallahasseePRs.Api.Services
{
    public class UserSearchService : IUserSearchService
    {
        private readonly AppDbContext _db;
        private readonly IObjectStorage _storage;


        public UserSearchService(
            IObjectStorage storage,
            AppDbContext db)        {
            _db = db;
            _storage = storage;
        }
        public async Task<List<UserSearchResultResponse>> SearchUsersAsync(
            Guid currentUserId,
            string query,
            int take,
            CancellationToken cancellationToken = default)
        {
            var queryText = query?.Trim() ?? string.Empty;

            if (queryText.Length < 2)
                return new List<UserSearchResultResponse>();

            take = Math.Clamp(take, 1, 50);

            var pattern = $"%{queryText}%";
            var startsWithPattern = $"{queryText}%";

            var profiles = await _db.Profiles
                .AsNoTracking()
                .Include(p => p.User)
                .Include(p => p.ProfilePicture)
                .Where(p => p.UserId != currentUserId)
                .Where(p =>
                    EF.Functions.ILike(p.User.UserName, pattern) ||
                    EF.Functions.ILike(p.DisplayName, pattern))
                .OrderBy(p => EF.Functions.ILike(p.User.UserName, startsWithPattern) ? 0 : 1)
                .ThenBy(p => EF.Functions.ILike(p.DisplayName, startsWithPattern) ? 0 : 1)
                .ThenBy(p => p.User.UserName)
                .Take(take)
                .ToListAsync(cancellationToken);

            var resultUserIds = profiles
                .Select(p => p.UserId)
                .ToList();

            var followingUserIds = await _db.Follows
                .AsNoTracking()
                .Where(f =>
                    f.FollowerId == currentUserId &&
                    resultUserIds.Contains(f.FollowedId))
                .Select(f => f.FollowedId)
                .ToListAsync(cancellationToken);

            var followingSet = followingUserIds.ToHashSet();

            var results = profiles.Select(p => new UserSearchResultResponse
            {
                UserId = p.UserId,
                UserName = p.User.UserName,
                DisplayName = p.DisplayName,

                ProfilePictureId = p.ProfilePictureId,
                ProfilePictureUrl = p.ProfilePicture != null
                    ? _storage.GetPublicUrl(p.ProfilePicture.ObjectKey)
                    : null,

                IsFollowing = followingSet.Contains(p.UserId)
            }).ToList();

            return results;
        }
    }
}
