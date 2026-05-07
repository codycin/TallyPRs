using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TallahasseePRs.Api.DTOs.Users;
using TallahasseePRs.Api.Services;

namespace TallahasseePRs.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]

    public class UsersController : ControllerBase
    {
        private readonly IUserSearchService _userSearchService;
        private readonly ICurrentUserService _currentUser;

        public UsersController(IUserSearchService userSearchService, ICurrentUserService current)
        {
            _userSearchService = userSearchService;
            _currentUser = current;
        }

        [HttpGet("search")]
        [Authorize]
        public async Task<ActionResult<List<UserSearchResultResponse>>> SearchUsers(
            [FromQuery] string query,
            [FromQuery] int take = 20,
            CancellationToken cancellationToken = default)
        {
            var currentUserId = _currentUser.GetUserId();

            var results = await _userSearchService.SearchUsersAsync(
                currentUserId,
                query,
                take,
                cancellationToken);

            return Ok(results);
        }
    }
}
