using BeautySalonAPI.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BeautySalonAPI.Controllers
{
    [ApiController]
    [Route("api/public/tenants")]
    public class TenantController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public TenantController(ApplicationDbContext context) => _context = context;

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll()
        {
            var tenants = await _context.Tenants
                .Where(t => t.Active)
                .OrderBy(t => t.Name)
                .Select(t => new {
                    id = t.Id,
                    slug = t.Slug,
                    name = t.Name,
                    address = t.Address,
                    phone = t.Phone,
                    timezone = t.Timezone
                })
                .ToListAsync();

            return Ok(tenants);
        }

        [HttpGet("{slug}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetBySlug(string slug)
        {
            var t = await _context.Tenants
                .Where(x => x.Active && x.Slug == slug)
                .Select(x => new {
                    id = x.Id,
                    slug = x.Slug,
                    name = x.Name,
                    address = x.Address,
                    phone = x.Phone,
                    timezone = x.Timezone
                })
                .FirstOrDefaultAsync();

            return t is null ? NotFound() : Ok(t);
        }
    }
}
