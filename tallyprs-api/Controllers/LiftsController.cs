using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TallahasseePRs.Api.Data;
using TallahasseePRs.Api.DTOs.Lift;

namespace TallahasseePRs.Api.Controllers
{
    [ApiController]
    [Route("api/lifts")]
    public class LiftsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public LiftsController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet("search")]
        [AllowAnonymous] 
        public async Task<ActionResult<List<LiftResponse>>> Search(
            [FromQuery] string? q,
            [FromQuery] int limit = 20,
            CancellationToken cancellationToken = default)
        {
            limit = Math.Clamp(limit, 1, 50);

            var query = _db.Lifts.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(q))
            {
                var term = q.Trim();

                term = term.ToLower();

                query = query.Where(l =>
                    l.Name.ToLower().Contains(term) ||
                    l.Category.ToLower().Contains(term));
            }

            var lifts = await query
                .OrderBy(l => l.Category)
                .ThenBy(l => l.Name)
                .Take(limit)
                .Select(l => new LiftResponse
                {
                    Id = l.Id,
                    Name = l.Name,
                    Category = l.Category,
                    DefaultUnit = l.DefaultUnit
                })
                .ToListAsync(cancellationToken);

            return Ok(lifts);
        }
    }
}
