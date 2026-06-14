
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client.Extensions.Msal;
using TallahasseePRs.Api.Data;
using TallahasseePRs.Api.DTOs.Follows;
using TallahasseePRs.Api.DTOs.Media;
using TallahasseePRs.Api.DTOs.Profiles;
using TallahasseePRs.Api.Models;
using TallahasseePRs.Api.Models.Users;
using TallahasseePRs.Api.Services.FollowServices;
using TallahasseePRs.Api.Services.Media;
using TallahasseePRs.Api.Services.Storage;

namespace TallahasseePRs.Api.Services.ProfileServices
{
    public class ProfileService : IProfileService, IProfileQueryService
    {
        private readonly AppDbContext _db;
        private readonly IObjectStorage _storage;
        private readonly IFollowService _follow;
        private readonly ICurrentUserService _currentUser;
        private readonly IMediaService _media;

        public ProfileService(AppDbContext appDbContext, IObjectStorage storage, IFollowService followService, ICurrentUserService cs, IMediaService ms)
        {
            _db = appDbContext;
            _storage = storage;
            _follow = followService;
            _currentUser = cs;
            _media = ms;
        }
        public async Task<ProfileResponse?> GetByIdAsync(Guid userId)
        {
            var profile = await _db.Profiles.Include(p=>p.ProfilePicture).Where(p => p.UserId == userId).SingleOrDefaultAsync();
            if (profile == null) return null;

            int followerCount = await _follow.GetFollowersCountAsync(userId);
            int followingCount = await _follow.GetFollowingCountAsync(userId);

            return ToResponse(profile, followerCount, followingCount);

        }
        public async Task<ProfileResponse?> UpdateAsync(Guid userId, UpdateProfileRequest request)
        {
            var profile = await _db.Profiles.Include(p => p.ProfilePicture).SingleOrDefaultAsync(p => p.UserId == userId);

            if (profile == null) return null;

            // Null = don't change 
            if (request.DisplayName is not null)
                profile.DisplayName = request.DisplayName.Trim();

            if (request.RemoveProfilePicture && profile.ProfilePictureId.HasValue)
            {
                await _media.DeleteAsync(profile.ProfilePictureId.Value, profile.UserId, false);
                profile.ProfilePictureId = null;

            }
            else if(request.ProfilePictureId.HasValue)
            {
                var media = await _db.Media.SingleOrDefaultAsync(m => m.Id == request.ProfilePictureId.Value);

                if (media == null) throw new InvalidOperationException("Profile picture media was not found");

                profile.ProfilePictureId = media.Id;
            }

            if (request.HomeGym is not null)
                profile.HomeGym = string.IsNullOrWhiteSpace(request.HomeGym) ? null : request.HomeGym.Trim();

            if (request.LifterType is not null)
                profile.LifterType = string.IsNullOrWhiteSpace(request.LifterType) ? null : request.LifterType.Trim();

            if (request.SpecialtyLifts is not null)
                profile.SpecialtyLifts = string.IsNullOrWhiteSpace(request.SpecialtyLifts) ? null : request.SpecialtyLifts.Trim();

            if (request.MeasurementsJson is not null)
            {
                profile.MeasurmentsJson = string.IsNullOrWhiteSpace(request.MeasurementsJson)
                    ? null
                    : request.MeasurementsJson;
            }

            await _db.SaveChangesAsync();

            return ToResponse(profile);

        }

        public async Task<PublicProfileResponse?> GetPublicByIdAsync(Guid? userId)
        {
            var currentUserId = _currentUser.UserId;


            var p = await _db.Profiles.Include(p=>p.ProfilePicture).SingleOrDefaultAsync(x => x.UserId == userId);
            int followerCount = await _follow.GetFollowersCountAsync(userId);
            int followingCount = await _follow.GetFollowingCountAsync(userId);
            bool isFollowedByCur = await _db.Follows.AnyAsync(f => f.FollowerId == currentUserId && f.FollowedId == userId);

            return p is null ? null : ToPublicResponse(p,followerCount,followingCount, isFollowedByCur);
        }

        public async Task<List<FollowUserResponse>> GetFollowingForUserAsync(Guid userId)
        {
            return await (
                    from f in _db.Follows.AsNoTracking()
                    join p in _db.Profiles.AsNoTracking()
                        on f.FollowedId equals p.UserId
                    where f.FollowerId == userId
                    select new FollowUserResponse
                    {
                        Id = f.Id,
                        UserId = p.UserId,
                        DisplayName = p.DisplayName,
                        CurrentUserFollows = true,
                        IsMutual = _db.Follows.Any(x =>
                            x.FollowerId == p.UserId &&
                            x.FollowedId == userId)

                    }
                ).ToListAsync();
        }
        public async Task<List<FollowUserResponse>> GetFollowersForUserAsync(Guid userId)
        {
            return await (
                    from f in _db.Follows.AsNoTracking()
                    join p in _db.Profiles.AsNoTracking()
                        on f.FollowerId equals p.UserId
                    where f.FollowedId == userId
                    let currentUserFollows = _db.Follows.Any(x =>
                        x.FollowerId == userId &&
                        x.FollowedId == p.UserId)
                    select new FollowUserResponse
                    {
                        Id = f.Id,
                        UserId = p.UserId,
                        DisplayName = p.DisplayName,
                        CurrentUserFollows = currentUserFollows,
                        IsMutual = currentUserFollows

                    }
                ).ToListAsync();
        }

        public async Task<List<FollowUserResponse>> GetFollowingForOtherUserAsync(Guid userId, Guid otherUserId)
        {
            return await (
                   from f in _db.Follows.AsNoTracking()
                   join p in _db.Profiles.AsNoTracking()
                       on f.FollowedId equals p.UserId
                   where f.FollowerId == otherUserId
                   select new FollowUserResponse
                   {
                       Id = f.Id,
                       UserId = p.UserId,
                       DisplayName = p.DisplayName,
                       CurrentUserFollows = _db.Follows.Any(x=> x.FollowerId == userId && x.FollowedId == p.UserId),
                       IsMutual = _db.Follows.Any(x =>
                           x.FollowerId == p.UserId &&
                           x.FollowedId == userId)

                   }
               ).ToListAsync();
        }

        public async Task<List<FollowUserResponse>> GetFollowersForOtherUserAsync(Guid userId, Guid otherUserId)
        {
            return await (
                   from f in _db.Follows.AsNoTracking()
                   join p in _db.Profiles.AsNoTracking()
                       on f.FollowerId equals p.UserId
                   where f.FollowedId == otherUserId
                   
                   select new FollowUserResponse
                   {
                       Id = f.Id,
                       UserId = p.UserId,
                       DisplayName = p.DisplayName,
                       CurrentUserFollows = _db.Follows.Any(x => x.FollowerId == userId && x.FollowedId == p.UserId),
                       IsMutual = _db.Follows.Any(x => x.FollowerId == p.UserId && x.FollowedId == userId)

                   }
               ).ToListAsync();
        }



        private ProfileResponse ToResponse(Profile profile, int followerCount=0, int followingCount=0) => new()
        {
            UserId = profile.UserId,
            DisplayName = profile.DisplayName,
            ProfilePicture = ToMediaResponse(profile.ProfilePicture),
            HomeGym = profile.HomeGym,
            LifterType = profile.LifterType,
            SpecialtyLifts = profile.SpecialtyLifts,
            MeasurementsJson = profile.MeasurmentsJson,
            FollowCount = followerCount,
            FollowingCount = followingCount
        };
        private PublicProfileResponse ToPublicResponse(Profile profile, int followerCount = 0, int followingCount = 0, bool isFollowedByCurrentUser = false) => new()
        {
            UserId = profile.UserId,
            DisplayName = profile.DisplayName,
            ProfilePicture = ToMediaResponse(profile.ProfilePicture),
            HomeGym = profile.HomeGym,
            LifterType = profile.LifterType,
            SpecialtyLifts = profile.SpecialtyLifts,
            FollowCount = followerCount,
            FollowingCount = followingCount,
            IsFollowedByCurrentUser = isFollowedByCurrentUser
        };

        private MediaResponse? ToMediaResponse(Models.Media? media)
        {
            if (media == null) return null;

            return new MediaResponse
            {
                Id = media.Id,
                Url = _storage.GetPublicUrl(media.ObjectKey),
                ThumbnailUrl = media.ThumbnailObjectKey != null
                    ? _storage.GetPublicUrl(media.ThumbnailObjectKey)
                    : null,

                Kind = media.Kind.ToString(),
                Purpose = media.Purpose.ToString(),

                OriginalFileName = media.OriginalFileName,
                ContentType = media.ContentType,
                SizeBytes = media.SizeBytes,

                Width = media.Width,
                Height = media.Height,
                DurationSeconds = media.DurationSeconds,

                CreatedAt = media.CreatedAt
            };
        }
    }
}
