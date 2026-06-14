using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TallahasseePRs.Api.Common.Paging;
using TallahasseePRs.Api.DTOs.Feed;
using TallahasseePRs.Api.DTOs.Follows;
using TallahasseePRs.Api.DTOs.Posts;
using TallahasseePRs.Api.Services;
using TallahasseePRs.Api.Services.FeedServices;
using TallahasseePRs.Api.Services.ProfileServices;

namespace TallahasseePRs.Api.Controllers
{
    [ApiController]
    [Route("api/profiles")]
    public sealed class PublicProfileController : ControllerBase
    {
        private readonly IProfileQueryService _profiles;
        private readonly ICurrentUserService _currentUser;
        private readonly IFeedService _feedService;


        public PublicProfileController(IProfileQueryService profiles, ICurrentUserService current, IFeedService feed)
        {
            _profiles = profiles;
            _currentUser = current;
            _feedService = feed;
        }
        [AllowAnonymous]
        [HttpGet("{userId:guid}")]
        public async Task<IActionResult> GetPublic(Guid userId)
        {
            var profile = await _profiles.GetPublicByIdAsync(userId);
            return profile is null ? NotFound() : Ok(profile);
        }
        [Authorize]
        [HttpGet("{userId:guid}/following")]
        public async Task<ActionResult<List<FollowUserResponse>>> GetPublicFollowing(Guid userId)
        {
            var currentUserId = _currentUser.GetUserId();
            return await _profiles.GetFollowingForOtherUserAsync(currentUserId, userId);
        }
        [Authorize]
        [HttpGet("{userId:guid}/follower")]
        public async Task<ActionResult<List<FollowUserResponse>>> GetPublicFollower(Guid userId)
        {
            var currentUserId = _currentUser.GetUserId();
            return await _profiles.GetFollowersForOtherUserAsync(currentUserId, userId);
        }
        [AllowAnonymous]

        [HttpGet("{userId:guid}/posts")]
        [EnableRateLimiting("reads")]
        public async Task<ActionResult<FeedPage<PostResponse>>> GetProfilePosts(
        Guid userId,
        [FromQuery] int limit = 20,
        [FromQuery] string? cursor = null)
        {
            var requestingUserId = _currentUser.UserId;

            DateTime? cursorCreatedAt = null;
            Guid? cursorId = null;

            if (CursorCodec.TryDecode(cursor, out var decodedAt, out var decodedId))
            {
                cursorCreatedAt = decodedAt;
                cursorId = decodedId;
            }

            var query = new FeedQuery
            {
                Type = FeedType.User,
                TargetUserId = userId,
                Limit = limit,
                CursorCreatedAt = cursorCreatedAt,
                CursorId = cursorId
            };

            var page = await _feedService.GetFeedAsync(query, requestingUserId);

            return Ok(page);
        }
    }
}
