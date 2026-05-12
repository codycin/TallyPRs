
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TallahasseePRs.Api.DTOs.Comments;
using TallahasseePRs.Api.Services;
using TallahasseePRs.Api.Services.PostServices;


namespace TallahasseePRs.Api.Controllers
{
    [ApiController]
    [Route("api")]
    [Authorize] 
    public class CommentsController : ControllerBase
    {
        private readonly ICommentService _comments;
        private readonly ICurrentUserService _currentUser;

        public CommentsController(ICommentService comments, ICurrentUserService currentUser)
        {
            _comments = comments;
            _currentUser = currentUser;
        }

        
        [HttpPost("posts/{postId:guid}/comments")]
        [EnableRateLimiting("writes")]
        public async Task<ActionResult<CommentResponse>> CreateTopLevel(
            [FromRoute] Guid postId,
            [FromBody] AddCommentRequest request)
        {
            var userId = _currentUser.GetUserId();
            var created = await _comments.CreateTopLevelAsync(postId, userId, request.Body);
            return Ok(created);
        }

        [HttpPost("posts/{postId:guid}/comments/{parentCommentId:guid}/replies")]
        [EnableRateLimiting("writes")]
        public async Task<ActionResult<CommentResponse>> Reply(
            [FromRoute] Guid postId,
            [FromRoute] Guid parentCommentId,
            [FromBody] AddCommentRequest request)
        {
            var userId = _currentUser.GetUserId();
            var created = await _comments.CreateReplyAsync(postId, parentCommentId, userId, request.Body);
            return Ok(created);
        }

        [AllowAnonymous] 
        [HttpGet("posts/{postId:guid}/comments")]
        public async Task<ActionResult<List<CommentResponse>>> GetForPost([FromRoute] Guid postId)
        {
            var thread = await _comments.GetThreadForPostAsync(postId);
            return Ok(thread);
        }

        
        [HttpDelete("comments/{commentId:guid}")]
        public async Task<IActionResult> Delete([FromRoute] Guid commentId)
        {
            var userId = _currentUser.GetUserId();
            var isAdmin = User.IsInRole("Admin"); 

            await _comments.DeleteAsync(commentId, userId, isAdmin);
            return NoContent();
        }
    }

}
