using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TallahasseePRs.Api.Common.Paging;
using TallahasseePRs.Api.DTOs.Feed;
using TallahasseePRs.Api.DTOs.Posts;
using TallahasseePRs.Api.DTOs.Profiles;
using TallahasseePRs.Api.Services;
using TallahasseePRs.Api.Services.FeedServices;
using TallahasseePRs.Api.Services.PostServices;
using TallahasseePRs.Api.Services.ProfileServices;
using TallahasseePRs.Api.DTOs.Follows;

namespace TallahasseePRs.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/me/[controller]")]
    public sealed class UserProfileController : ControllerBase
    {
        private readonly IProfileService _profiles;
        private readonly IFeedService _feedService;
        private readonly ICurrentUserService _currentUser;
        public UserProfileController(IProfileService profiles, ICurrentUserService CurrentUser, IFeedService feed)
        {
            _profiles = profiles;
            _currentUser = CurrentUser;
            _feedService = feed;
        }

        [HttpGet]
        public async Task<IActionResult> GetById()
        {
            var profile = await _profiles.GetByIdAsync(_currentUser.GetUserId());
            return (profile == null) ? NotFound() : Ok(profile);
        }
        

        [HttpPut]
        [EnableRateLimiting("writes")]

        public async Task<IActionResult> Update([FromBody] UpdateProfileRequest request)
        {
            var userId = _currentUser.GetUserId();

            try
            {
                var updated = await _profiles.UpdateAsync(userId, request);
                if (updated is null) return NotFound();
                return Ok(updated);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpGet("following")]
        public async Task<ActionResult<List<FollowUserResponse>>> GetFollowing()
        {
            var profile = _currentUser.GetUserId();

            return await _profiles.GetFollowingForUserAsync(profile);

        }
        [HttpGet("follower")]
        public async Task<ActionResult<List<FollowUserResponse>>> GetFollowers()
        {
            var profile = _currentUser.GetUserId();

            return await _profiles.GetFollowersForUserAsync(profile);

        }

    }
}
