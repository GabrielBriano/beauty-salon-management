using Microsoft.AspNetCore.Authorization;
using BeautySalonAPI.Data;
using BeautySalonAPI.DTOs;
using BeautySalonAPI.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BeautySalonAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class WorkScheduleController : SecureBaseController
    {
        private readonly ApplicationDbContext _context;

        public WorkScheduleController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var schedules = await _context.WorkSchedules
                .Include(ws => ws.Provider)
                .Where(ws => ws.Provider.TenantId == (TenantId ?? 0))
                .ToListAsync();

            return Ok(schedules);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] WorkScheduleCreateDTO dto)
        {
            if (!IsBoss)
                return Forbid();

            var providerInTenant = await _context.Users.AnyAsync(u => u.Id == dto.ProviderId && u.TenantId == TenantId);
            if (!providerInTenant)
                return BadRequest("Profissional não encontrado nesta loja.");

            var model = new WorkSchedule
            {
                ProviderId = dto.ProviderId,
                DayOfWeek = (DayOfWeek)dto.DayOfWeek,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime

            };

            _context.WorkSchedules.Add(model);
            await _context.SaveChangesAsync();

            return Ok(model);
        }
    }
}
