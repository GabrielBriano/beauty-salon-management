using BeautySalonAPI.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BeautySalonAPI.Infrastructure.Tenancy;

namespace BeautySalonAPI.Controllers
{
    [ApiController]
    [Route("api")]                
    [Route("api/{tenantSlug}")]   
    public class AvailabilityController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ITenantResolver _tenantResolver;

        public AvailabilityController(ApplicationDbContext context, ITenantResolver tenantResolver)
        {
            _context = context;
            _tenantResolver = tenantResolver;
        }

        // GET /api/availability?professionalId=...&serviceId=...&date=YYYY-MM-DD
        // GET /api/{tenantSlug}/availability?professionalId=...&serviceId=...&date=YYYY-MM-DD
        [HttpGet("availability")]
        public async Task<IActionResult> GetAvailableSlots(
            [FromQuery] int serviceId,
            [FromQuery] string? professionalId,
            [FromQuery] string? providerId,  // compat legado
            [FromQuery] string date
        )
        {
            var tenantId = await _tenantResolver.ResolveTenantIdAsync(HttpContext, _context);

            var profId = professionalId ?? providerId;
            if (string.IsNullOrWhiteSpace(profId))
                return BadRequest("Informe professionalId.");

            if (!DateOnly.TryParse(date, out var day))
                return BadRequest("Data inválida.");

            // 1) duração do serviço
            var service = await _context.Services
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == serviceId && s.TenantId == tenantId);
            if (service == null) return NotFound("Serviço não encontrado.");

            var duration = service.DurationMin > 0 ? service.DurationMin : 30; // 

            // 2) expediente do profissional (WorkSchedules)
            var schedule = await _context.WorkSchedules
                .AsNoTracking()
                .FirstOrDefaultAsync(ws => ws.ProviderId == profId && ws.DayOfWeek == day.DayOfWeek);
            if (schedule == null)
                return Ok(new { availableSlots = new List<string>() });

            var startTime = schedule.StartTime; // TimeSpan
            var endTime = schedule.EndTime;   // TimeSpan

            // 3) agendamentos do dia (filtra por tenant + profissional)
            var dayStart = day.ToDateTime(TimeOnly.MinValue);
            var dayEnd = day.ToDateTime(TimeOnly.MaxValue);

            var appts = await _context.Appointments
                .Where(a => a.TenantId == tenantId
                            && a.ProfessionalId == profId
                            && a.DateTimeInit < dayEnd
                            && a.DateTimeEnd > dayStart)
                .Select(a => new { a.DateTimeInit, a.DateTimeEnd })
                .ToListAsync(); // usa Appointment.ProfessionalId string e TenantId int 

            // 4) slots livres (passo de 15 min, respeita “não no passado”)
            var availableSlots = new List<string>();
            var now = DateTime.Now;
            var isToday = day == DateOnly.FromDateTime(now);
            var current = startTime;

            while (current.Add(TimeSpan.FromMinutes(duration)) <= endTime)
            {
                if (isToday && current <= now.TimeOfDay)
                {
                    current = current.Add(TimeSpan.FromMinutes(15));
                    continue;
                }

                var candidateStart = day.ToDateTime(TimeOnly.FromTimeSpan(current));
                var candidateEnd = candidateStart.AddMinutes(duration);

                bool conflict = appts.Any(a => candidateStart < a.DateTimeEnd && candidateEnd > a.DateTimeInit);
                if (!conflict)
                    availableSlots.Add(current.ToString(@"hh\:mm"));

                current = current.Add(TimeSpan.FromMinutes(15));
            }

            return Ok(new { availableSlots });
        }
    }
}
