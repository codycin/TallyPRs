using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TallahasseePRs.Api.DTOs.Judging;
using TallahasseePRs.Api.DTOs.Posts;
using TallahasseePRs.Api.Services;
using TallahasseePRs.Api.Services.PostServices;


namespace TallahasseePRs.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class PostsController : ControllerBase
{
    private readonly IPostService _posts;
    private readonly ICurrentUserService _currentUser;
    public PostsController(IPostService posts, ICurrentUserService CurrentUser)
    {
        _posts = posts;
        _currentUser = CurrentUser;
    }

    
    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> GetById(Guid id)
    {
        var post = await _posts.GetByIdAsync(id);
        if (post is null) return NotFound();
        return Ok(post);
    }

    
    [Authorize]
    [HttpPost]
    [EnableRateLimiting("writes")]

    public async Task<IActionResult> Create([FromBody] CreatePostRequest request) 
    {
        var userId = _currentUser.GetUserId();       
        var created = await _posts.CreateAsync(userId, request);

        
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    
    [Authorize]
    [HttpPut("{id:guid}")]
    [EnableRateLimiting("writes")]


    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePostRequest request) 
    {
        var userId = _currentUser.GetUserId();
        
        try
        {
            var updated = await _posts.UpdateAsync(userId, id, request);
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

    
    [Authorize]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete([FromRoute] Guid id)
    {
        var userId = _currentUser.GetUserId();
        var isAdmin = User.IsInRole("Admin"); 

        //Try catch in case not user
        try
        {
            var deleted = await _posts.DeleteAsync(userId, id, isAdmin);
            if (!deleted) return NotFound();
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}/admin")]
    public async Task<IActionResult> DeleteAsAdmin([FromRoute] Guid id, [FromBody] AdminDeleteRequest? request)
    {
        var userId = _currentUser.GetUserId();

        //Try catch again to check for user
        try
        {
            var deleted = await _posts.DeleteAsAdminAsync(userId, id, request?.Comment);
            if (!deleted) return NotFound();
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }
    [HttpPut("{id:guid}/judge")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Judge(Guid id, [FromBody] JudgeRequest request)
    {
        var result = await _posts.JudgeAsync(id, request, _currentUser.GetUserId());

        if (result is null)
            return NotFound();

        return Ok(result);
    }


}