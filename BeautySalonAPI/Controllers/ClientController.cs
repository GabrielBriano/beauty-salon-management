using BeautySalonAPI.Data;
using BeautySalonAPI.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BeautySalonAPI.Controllers
{
    [ApiController]
    [Route("api/client")]
    public class ClientController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ClientController (ApplicationDbContext context)
        {
            _context = context;
        }

        // POST: /api/client/public
        [HttpPost("public")]
        public async Task <IActionResult> CreateClient([FromBody] PublicClientModel model)
        {
            if (string.IsNullOrWhiteSpace(model.Name) || string.IsNullOrWhiteSpace(model.Phone))
                return BadRequest("Nome e telefone são obrigatórios.");

            var client = new Client
            {
                Name = model.Name,
                Phone = model.Phone,
                Email = model.Email,
                TenantId = model.TenantId
            };

            _context.Clients.Add(client);
            await _context.SaveChangesAsync();

            return Ok(client);
        }
        public class PublicClientModel
        {
            public string Name { get; set; }
            public string Phone { get; set; }
            public string? Email { get; set; }
            public int TenantId { get; set; }
        }
    }
}
