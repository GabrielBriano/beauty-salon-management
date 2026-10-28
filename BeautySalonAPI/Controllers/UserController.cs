using BeautySalonAPI.Data;
using BeautySalonAPI.Infrastructure.Tenancy;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BeautySalonAPI.Controllers
{
    [ApiController]
    [Route("api/user")]
    [Route("api/{tenantSlug}/user")]
    public class UserController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ITenantResolver _tenantResolver;

        public UserController(ApplicationDbContext context, ITenantResolver tenantResolver)
        {
            _context = context;
            _tenantResolver = tenantResolver;
        }

        [Authorize]
        [HttpGet("me")]
        public IActionResult GetCurrentUser()
        {
            var userId = User.FindFirstValue("UserId");
            var tenantId = User.FindFirstValue("TenantId");
            var type = User.FindFirstValue("Type");

            return Ok(new
            {
                userId,
                tenantId,
                type
            });
        }

        [HttpGet("professionals")]
        [AllowAnonymous]
        public async Task<IActionResult> GetProfessionals()
        {
            var tenantId = await _tenantResolver.ResolveTenantIdAsync(HttpContext, _context);

            var professionals = await _context.Users
                .Where(u => u.Type.ToLower() == "professional" && u.TenantId == tenantId && u.Active)
                .Select(u => new
                {
                    u.Id,
                    u.Name
                })
                .ToListAsync();

            return Ok(professionals);
        }
    }
}
