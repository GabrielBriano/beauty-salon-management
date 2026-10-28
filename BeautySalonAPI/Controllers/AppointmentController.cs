using BeautySalonAPI.Data;
using BeautySalonAPI.Entities;
using BeautySalonAPI.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BeautySalonAPI.Infrastructure.Tenancy;
using System.Globalization;

namespace BeautySalonAPI.Controllers
{
    [ApiController]
    [Route("api/appointment")]                // legado
    [Route("api/{tenantSlug}/appointment")]   // novo (slug)
    [Authorize]
    public class AppointmentController : SecureBaseController
    {
        private readonly ApplicationDbContext _context;
        private readonly ITenantResolver _tenantResolver;

        public AppointmentController(ApplicationDbContext context, ITenantResolver tenantResolver)
        {
            _context = context;
            _tenantResolver = tenantResolver;
        }

        private static DateTime? CombineLocalDateAndTime(string? date, string? time)
        {
            if (string.IsNullOrWhiteSpace(date) || string.IsNullOrWhiteSpace(time)) return null;
            if (DateTime.TryParseExact($"{date} {time}", "yyyy-MM-dd HH:mm",
                CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt))
            {
                return dt;
            }
            return null;
        }

        // GET: /api/appointment  ou  /api/{slug}/appointment
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? tenantId = null)
        {
            if (!TenantId.HasValue) return Unauthorized();
            var resolvedTenantId = TenantId.Value;

            var list = await (
                from a in _context.Appointments.AsNoTracking()
                where a.TenantId == resolvedTenantId

                // serviço (mesmo tenant)
                join s in _context.Services.AsNoTracking()
                    on new { Id = a.ServiceId, TenantId = a.TenantId }
                    equals new { Id = s.Id, TenantId = s.TenantId }
                    into sj
                from s in sj.DefaultIfEmpty()

                    // profissional (mesmo tenant)
                join u in _context.Users.AsNoTracking()
                    on new { Id = a.ProfessionalId, TenantId = a.TenantId }
                    equals new { Id = u.Id, TenantId = u.TenantId }
                    into uj
                from u in uj.DefaultIfEmpty()

                    // cliente (mesmo tenant) — lembrando que a.ClientId é string
                join c in _context.Clients.AsNoTracking()
                    on new { ClientId = a.ClientId, TenantId = a.TenantId }
                    equals new { ClientId = c.Id.ToString(), TenantId = c.TenantId }
                    into cj
                from c in cj.DefaultIfEmpty()

                select new
                {
                    a.Id,
                    a.ClientId,
                    ClientName = c != null ? c.Name : null,

                    a.ProfessionalId,
                    ProfessionalName = u != null ? u.Name : null,

                    a.ServiceId,
                    ServiceName = s != null ? s.Name : null,

                    a.DateTimeInit,
                    a.DateTimeEnd,
                    a.Status,
                    a.Observations,
                    a.TenantId
                }
            )
            .OrderBy(a => a.DateTimeInit)
            .ToListAsync();

            return Ok(list);
        }

        // GET: /api/appointment/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null || appointment.TenantId != TenantId) return NotFound();
            return Ok(appointment);
        }

        // GET público: /api/{slug}/appointment/busy  (apenas horários ocupados, sem dados de clientes)
        [HttpGet("busy")]
        [AllowAnonymous]
        public async Task<IActionResult> GetBusy()
        {
            var tenantId = await _tenantResolver.ResolveTenantIdAsync(HttpContext, _context);
            var from = DateTime.Today.AddDays(-31);

            var list = await _context.Appointments
                .AsNoTracking()
                .Where(a => a.TenantId == tenantId && a.DateTimeInit >= from)
                .Select(a => new { a.DateTimeInit, a.DateTimeEnd })
                .ToListAsync();

            return Ok(list);
        }

        // POST interno (autenticado): /api/appointment  ou  /api/{slug}/appointment
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] AppointmentCreateDTO model, [FromQuery] int? tenantId = null)
        {
            if (!TenantId.HasValue) return Unauthorized();
            var resolvedTenantId = TenantId.Value;

            if (model.DateTimeInit < DateTime.Now)
                return BadRequest("Não é possível agendar no passado.");

            var service = await _context.Services
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == model.ServiceId && s.TenantId == resolvedTenantId);
            if (service == null)
                return BadRequest("Serviço não encontrado.");

            var end = model.DateTimeEnd ?? model.DateTimeInit.AddMinutes(service.DurationMin > 0 ? service.DurationMin : 30);

            var hasConflict = await _context.Appointments.AnyAsync(a =>
                a.TenantId == resolvedTenantId &&
                a.ProfessionalId == model.ProfessionalId &&
                model.DateTimeInit < a.DateTimeEnd &&
                end > a.DateTimeInit);

            if (hasConflict)
                return Conflict("Já existe um agendamento nesse horário para o profissional.");

            var entity = new Appointment
            {
                ClientId = model.ClientId,
                ProfessionalId = model.ProfessionalId,
                ServiceId = model.ServiceId,
                DateTimeInit = model.DateTimeInit,
                DateTimeEnd = end,
                Status = string.IsNullOrWhiteSpace(model.Status) ? "Pendente" : model.Status,
                Observations = model.Observations,
                TenantId = resolvedTenantId
            };

            _context.Appointments.Add(entity);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = entity.Id }, entity);
        }

        // POST público: /api/{slug}/appointment/public   (ou legado /api/appointment/public?tenantId=1)
        [HttpPost("public")]
        [AllowAnonymous]
        public async Task<IActionResult> CreatePublic([FromBody] AppointmentPublicDTO model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // 0) Resolve tenant (slug > header > query)
            var tenantId = await _tenantResolver.ResolveTenantIdAsync(HttpContext, _context);

            // 1) Resolver início: StartDateTime (novo) OU Date+Time (legado)
            DateTime? start = model.StartDateTime ?? CombineLocalDateAndTime(model.Date, model.Time);
            if (start == null) return BadRequest("Data/Hora inválidas.");
            if (start.Value < DateTime.Now) return BadRequest("Não é possível agendar no passado.");

            // 2) Serviço para obter duração
            var service = await _context.Services
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == model.ServiceId && s.TenantId == tenantId);
            if (service == null) return BadRequest("Serviço não encontrado.");

            var durationMin = service.DurationMin > 0 ? service.DurationMin : 30;
            var end = start.Value.AddMinutes(durationMin);

            // 3) Profissional válido
            var professionalExists = await _context.Users
                .AnyAsync(u => u.Type == "professional" && u.Id == model.ProfessionalId && u.TenantId == tenantId && u.Active);
            if (!professionalExists) return BadRequest("Profissional inválido.");

            // 4) Jornada (WorkSchedule) do dia
            var schedule = await _context.WorkSchedules
                .FirstOrDefaultAsync(ws => ws.ProviderId == model.ProfessionalId && ws.DayOfWeek == start.Value.DayOfWeek);
            if (schedule == null) return BadRequest("O profissional não atende neste dia da semana.");
            if (start.Value.TimeOfDay < schedule.StartTime || end.TimeOfDay > schedule.EndTime)
                return BadRequest("Horário fora do expediente do profissional.");

            // 5) Upsert do cliente (por e-mail); se não houver e-mail, cria mínimo
            Client client;
            if (!string.IsNullOrWhiteSpace(model.Email))
            {
                client = await _context.Clients.FirstOrDefaultAsync(c => c.Email == model.Email && c.TenantId == tenantId);
                if (client != null)
                {
                    if (!string.IsNullOrWhiteSpace(model.Name)) client.Name = model.Name!;
                    if (!string.IsNullOrWhiteSpace(model.Phone)) client.Phone = model.Phone!;
                    await _context.SaveChangesAsync();
                }
                else
                {
                    client = new Client
                    {
                        Name = string.IsNullOrWhiteSpace(model.Name) ? "Cliente" : model.Name!,
                        Email = model.Email!,
                        Phone = model.Phone ?? string.Empty,
                        TenantId = tenantId
                    };
                    _context.Clients.Add(client);
                    await _context.SaveChangesAsync();
                }
            }
            else
            {
                client = new Client
                {
                    Name = string.IsNullOrWhiteSpace(model.Name) ? "Cliente" : model.Name!,
                    Email = string.Empty,
                    Phone = model.Phone ?? string.Empty,
                    TenantId = tenantId
                };
                _context.Clients.Add(client);
                await _context.SaveChangesAsync();
            }

            // 6) Conflito de horário (profissional + tenant)
            var hasConflict = await _context.Appointments.AnyAsync(a =>
                a.TenantId == tenantId &&
                a.ProfessionalId == model.ProfessionalId &&
                start.Value < a.DateTimeEnd &&
                end > a.DateTimeInit);

            if (hasConflict)
                return Conflict("O profissional já possui um agendamento neste horário.");

            // 7) Criar agendamento
            var appointment = new Appointment
            {
                ClientId = client.Id.ToString(),
                ProfessionalId = model.ProfessionalId,
                ServiceId = model.ServiceId,
                DateTimeInit = start.Value,
                DateTimeEnd = end,
                Status = "Pendente",
                TenantId = tenantId,
                Observations = model.Notes
            };

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

            // 8) Retorno
            var professionalName = await _context.Users
                .Where(u => u.Id == model.ProfessionalId)
                .Select(u => u.Name)
                .FirstOrDefaultAsync();

            return Ok(new
            {
                appointmentId = appointment.Id,
                status = appointment.Status,
                summary = new
                {
                    serviceName = service.Name,
                    professional = professionalName,
                    startDateTime = appointment.DateTimeInit,
                    endDateTime = appointment.DateTimeEnd,
                    price = service.Price,
                    currency = "BRL"
                }
            });
        }

        // PUT: /api/appointment/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] AppointmentUpdateDTO model, int? tenantId)
        {
            if (!TenantId.HasValue) return Unauthorized();
            var resolvedTenantId = TenantId.Value;

            if (id != model.Id) return BadRequest("Id do corpo não bate com a rota.");

            // NÃO valida navigation "Service"
            ModelState.Remove("Service");
            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            var entity = await _context.Appointments
                .FirstOrDefaultAsync(a => a.Id == id && a.TenantId == resolvedTenantId);

            if (entity == null) return NotFound();

            // valida serviço e calcula fim (se você usa duração do serviço)
            var svc = await _context.Services
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == model.ServiceId && s.TenantId == resolvedTenantId);
            if (svc == null) return BadRequest("Serviço inválido para este tenant.");

            var dateEnd = model.DateTimeInit.AddMinutes(svc.DurationMin);

            // conflito de horário com mesmo profissional (exclui o próprio)
            var hasConflict = await _context.Appointments.AnyAsync(a =>
                a.Id != id &&
                a.TenantId == resolvedTenantId &&
                a.ProfessionalId == model.ProfessionalId &&
                a.DateTimeInit < dateEnd &&
                a.DateTimeEnd > model.DateTimeInit
            );
            if (hasConflict) return Conflict("Conflito de horário para este profissional.");

            // aplica campos SEM anexar navigation
            entity.ClientId = model.ClientId;
            entity.ProfessionalId = model.ProfessionalId;
            entity.ServiceId = model.ServiceId;
            entity.DateTimeInit = model.DateTimeInit;
            entity.DateTimeEnd = dateEnd;
            entity.Status = string.IsNullOrWhiteSpace(model.Status) ? entity.Status : model.Status;
            entity.Observations = model.Observations;

            // garante que não tem navigation anexada
            entity.Service = null;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: /api/appointment/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var existing = await _context.Appointments.FindAsync(id);
            if (existing == null || existing.TenantId != TenantId) return NotFound();

            _context.Appointments.Remove(existing);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
