using BeautySalonAPI.Data;
using BeautySalonAPI.Entities;
using BeautySalonAPI.Infrastructure.Tenancy;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BeautySalonAPI.Controllers
{
    [ApiController]
    [Route("api/service")]
    [Route("api/{tenantSlug}/service")]
    [Authorize]
    public class ServiceController : SecureBaseController
    {
        private readonly ApplicationDbContext _context;
        private readonly ITenantResolver _tenantResolver;

        public ServiceController(ApplicationDbContext context, ITenantResolver tenantResolver)
        {
            _context = context;
            _tenantResolver = tenantResolver;
        }

        // GET: /api/service?tenantId=1
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll([FromQuery] int? tenantId = null)
        {
            var resolvedTenantId = await _tenantResolver.ResolveTenantIdAsync(HttpContext, _context);

            var list = await _context.Services
                .Where(s => s.TenantId == resolvedTenantId)
                .OrderBy(s => s.Name)
                .Select(s => new
                {
                    s.Id,
                    s.Name,
                    s.Description,
                    s.DurationMin,
                    s.Price
                })
                .ToListAsync();

            return Ok(list);
        }

        // GET: /api/service/5
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById(int id)
        {
            var service = await _context.Services.FindAsync(id);
            if (service == null)
            {
                return NotFound();
            }

            return Ok(service);
        }

        // POST: /api/service
        [HttpPost]
        public async Task<IActionResult> Create(Service model)
        {
            if (!IsBoss)
                return Forbid();

            model.TenantId = TenantId ?? 0;

            _context.Services.Add(model);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = model.Id }, model);
        }

        // PUT: /api/service/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Service model)
        {
            if (!IsBoss)
                return Forbid();

            model.TenantId = TenantId ?? 0;

            if (id != model.Id)
                return BadRequest();

            var existing = await _context.Services.FindAsync(id);
            if (existing == null || existing.TenantId != TenantId)
                return NotFound();

            existing.Name = model.Name;
            existing.Description = model.Description;
            existing.DurationMin = model.DurationMin;
            existing.Price = model.Price;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: /api/service/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            if (!IsBoss)
                return Forbid();


            var service = await _context.Services.FindAsync(id);
            if (service == null || service.TenantId != TenantId)
                return NotFound();

            _context.Services.Remove(service);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
