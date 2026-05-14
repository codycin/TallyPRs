using Azure.Core;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using TallahasseePRs.Api.Data;
using TallahasseePRs.Api.DTOs.Media;
using TallahasseePRs.Api.Services;
using TallahasseePRs.Api.Services.Media;

namespace TallahasseePRs.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public sealed class MediaController : ControllerBase
    {
        private readonly IMediaService _mediaService;
        private readonly ICurrentUserService _currentUserService;
        private readonly AppDbContext _db;

        public MediaController(AppDbContext db, IMediaService mediaService, ICurrentUserService currentUserService)
        {
            _mediaService = mediaService;
            _currentUserService = currentUserService;
            _db = db;
        }

        [HttpPost("uploads")]
        [EnableRateLimiting("writes")]

        public async Task<ActionResult<CreateMediaUploadResponse>> CreateUpload(
            [FromBody] CreateMediaUploadRequest request,
            CancellationToken cancellationToken)
        {
            var userId = _currentUserService.GetUserId();

            try
            {
                var result = await _mediaService.CreateUploadAsync(
                    userId,
                    request,
                    cancellationToken);

                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [HttpPost("{id:guid}/complete")]
        [EnableRateLimiting("writes")]

        public async Task<ActionResult<MediaResponse>> CompleteUpload(Guid id, CancellationToken cancellationToken)
        {
            var userId = _currentUserService.GetUserId();
            var result = await _mediaService.MarkUploadCompleteAsync(id, userId, cancellationToken);

            if (result is null) return NotFound();

            return Ok(result);

        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<MediaResponse>> GetById(Guid id, CancellationToken cancellationToken)
        {
            var userId = _currentUserService.GetUserId();

            var result = await _mediaService.GetByIdAsync(
                id,
                userId,
                cancellationToken);

            if (result is null)
                return NotFound();

            return Ok(result);
        }

        [HttpGet("post/{postId:guid}")]
        [AllowAnonymous]
        public async Task<ActionResult<IReadOnlyList<MediaResponse>>> GetForPost(Guid postId, CancellationToken cancellationToken)
        {
            var result = await _mediaService.GetForPostAsync(postId, cancellationToken);

            return Ok(result);
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
        {
            var userId = _currentUserService.GetUserId();

            await _mediaService.DeleteAsync(userId,id,false, cancellationToken);

            return NoContent();
        }

        [HttpGet("{mediaId:guid}/debug")]
        public async Task<IActionResult> DebugMedia(Guid mediaId, CancellationToken cancellationToken)
        {
            var userId = _currentUserService.GetUserId();

            var media = await _db.Media
                .AsNoTracking()
                .Where(m => m.Id == mediaId)
                .Select(m => new
                {
                    m.Id,
                    m.OwnerId,
                    m.ObjectKey,
                    m.Status,
                    CurrentUserId = userId
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (media is null)
                return NotFound(new { message = "No media row found at all." });

            return Ok(media);
        }
        [AllowAnonymous]
        [HttpGet("all")]
        public async Task<IActionResult> GetAllMedia()
        {
            var media = await _db.Media
                .OrderByDescending(m => m.CreatedAt)
                .Select(m => new
                {
                    m.Id,
                    m.OwnerId,
                    m.Purpose,
                    m.Status,
                    m.PostId,
                    m.CommentId,
                    m.ProfileId,
                    m.CreatedAt,
                    m.UploadedAt
                }).Where(m => m.PostId == null && m.ProfileId == null)
                .ToListAsync();

            return Ok(media);
        }
        [Authorize(Roles = "Admin")]
        [HttpDelete("allUnused")]
        public async Task<IActionResult> DeleteAllUnused(CancellationToken cancellationToken)
        {
            var candidateIds = await _db.Media
                .Where(m =>
                    m.PostId == null &&
                    m.CommentId == null &&
                    m.ProfileId == null)
                .OrderByDescending(m => m.CreatedAt)
                .Select(m => m.Id)
                .ToListAsync(cancellationToken);

            foreach (var mediaId in candidateIds)
            {
                var isUsedAsProfilePicture = await _db.Profiles
                    .AnyAsync(p => p.ProfilePictureId == mediaId, cancellationToken);

                if (isUsedAsProfilePicture)
                    continue;

                await _mediaService.DeleteAsAdminAsync(mediaId, cancellationToken);
            }

            return NoContent();
        }
    }
}
