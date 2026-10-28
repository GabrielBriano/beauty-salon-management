using Microsoft.AspNetCore.Authorization;
using BeautySalonAPI.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BeautySalonAPI.Controllers
{
    [ApiController]
    [Route("api/dashboard")]
    [Authorize]
    public class DashboardController : SecureBaseController
    {
        private readonly ApplicationDbContext _context;

        public DashboardController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetDashboard()
        {
            if (!TenantId.HasValue) return Unauthorized();
            var tenantId = TenantId.Value;

            var today = DateTime.Today;
            var tomorrow = today.AddDays(1);

            var appointmentsTodayCount = await _context.Appointments
                .CountAsync(a => a.TenantId == tenantId && a.DateTimeInit >= today && a.DateTimeInit < tomorrow);

            var totalRevenueToday = await _context.Appointments
                .Where(a => a.TenantId == tenantId && a.DateTimeInit >= today && a.DateTimeInit < tomorrow)
                .Join(_context.Services,
                      appt => appt.ServiceId,
                      serv => serv.Id,
                      (appt, serv) => serv.Price)
                .SumAsync();

            var serviceCounts = await _context.Appointments
                .Where(a => a.TenantId == tenantId)
                .GroupBy(a => a.ServiceId)
                .Select(g => new { ServiceId = g.Key, Count = g.Count() })
                .OrderByDescending(g => g.Count)
                .Take(5)
                .ToListAsync();

            var serviceNames = await _context.Services
                .Where(s => serviceCounts.Select(c => c.ServiceId).Contains(s.Id))
                .ToDictionaryAsync(s => s.Id, s => s.Name);

            var mostRequestedServices = serviceCounts
                .Select(c => new { Name = serviceNames[c.ServiceId], Count = c.Count })
                .ToList();

            var totalStockQuantity = await _context.Stocks
                .Where(s => s.TenantId == tenantId)
                .SumAsync(s => s.Quantity);

            var latestAppointments = await _context.Appointments
                .Where(a => a.TenantId == tenantId)
                .OrderByDescending(a => a.DateTimeInit)
                .Take(5)
                .Join(_context.Services,
                      a => a.ServiceId,
                      s => s.Id,
                      (a, s) => new {
                          a.ClientId,
                          ServiceName = s.Name,
                          a.DateTimeInit
                      })
                .ToListAsync();

            return Ok(new
            {
                appointmentsTodayCount,
                totalRevenueToday,
                mostRequestedServices,
                totalStockQuantity,
                latestAppointments
            });
        }
    }
}