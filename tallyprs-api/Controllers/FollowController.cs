using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TallahasseePRs.Api.DTOs.Follows;
using TallahasseePRs.Api.Models.Users;
using TallahasseePRs.Api.Services;
using TallahasseePRs.Api.Services.FollowServices;

namespace TallahasseePRs.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public sealed class FollowController : ControllerBase
    {
        private readonly IFollowService _follow;
        private readonly ICurrentUserService _currentUser;
        public FollowController(IFollowService Follows, ICurrentUserService CurrentUser)
        {
            _follow = Follows;
            _currentUser = CurrentUser;
        }
        [HttpGet("{id:guid}")]
        public async Task<ActionResult<FollowResponse>> GetById([FromRoute] Guid id)
        {
            var userId = _currentUser.GetUserId();
            var follow = await _follow.GetByIdAsync(userId, id); 
            return follow is null ? NotFound() : Ok(follow);
        }

        [HttpPost]
        public async Task<ActionResult<FollowResponse>> Create([FromBody] FollowRequest request) 
        {
            try
            {
                var result = await _follow.FollowAsync(_currentUser.GetUserId(), request);
                
                return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
            catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
            catch (UnauthorizedAccessException) { return Forbid(); }
        }
        [HttpDelete("{followedId:guid}")]
        public async Task<IActionResult> Unfollow([FromRoute] Guid followedId)
        {

            var removed = await _follow.UnFollowAsync(_currentUser.GetUserId(), followedId);
            return removed ? NoContent() : NotFound();
        }

    }
}
