using BeautySalonAPI.Data;
using BeautySalonAPI.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BeautySalonAPI.Controllers
{
    [ApiController]
    [Route("api/stockmovement")]
    [Authorize]
    public class StockMovementController : SecureBaseController
    {
        private readonly ApplicationDbContext _context;

        public StockMovementController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: /api/stockmovement (a loja vem do token)
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            if (!TenantId.HasValue) return Unauthorized();
            var tenantId = TenantId.Value;

            var list = await _context.Movements
                .Where(m => m.TenantId == tenantId)
                .OrderByDescending(m => m.Date)
                .ToListAsync();

            return Ok(list);
        }

        // GET: /api/stockmovement/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var movement = await _context.Movements.FindAsync(id);
            if (movement == null || movement.TenantId != TenantId)
                return NotFound();

            return Ok(movement);
        }

        // POST: /api/stockmovement
        [HttpPost]
        public async Task<IActionResult> Create(StockMovement model)
        {
            if (!IsBoss)
                return Forbid();

            model.TenantId = TenantId ?? 0;

            var stock = await _context.Stocks.FirstOrDefaultAsync(s => s.Id == model.ProductId && s.TenantId == model.TenantId);
            if (stock == null)
                return BadRequest("Stock product not found for this salon.");

            if (model.Type.ToLower() == "entrada")
            {
                stock.Quantity += model.Quantity;
            }
            else if (model.Type.ToLower() == "saida")
            {
                if (stock.Quantity < model.Quantity)
                    return BadRequest("Insufficient stock for the requested output.");

                stock.Quantity -= model.Quantity;
            }
            else
            {
                return BadRequest("Invalid movement type. Use ‘Incoming’ or ‘Outgoing’.");
            }

            _context.Movements.Add(model);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = model.Id }, model);
        }

        // DELETE: /api/stockmovement/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            if (!IsBoss)
                return Forbid();

            var movement = await _context.Movements.FindAsync(id);
            if (movement == null || movement.TenantId != TenantId)
                return NotFound();

            _context.Movements.Remove(movement);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}