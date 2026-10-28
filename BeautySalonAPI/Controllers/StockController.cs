using BeautySalonAPI.Data;
using BeautySalonAPI.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BeautySalonAPI.Controllers
{
    [ApiController]
    [Route("api/stock")]
    [Authorize]
    public class StockController : SecureBaseController
    {
        private readonly ApplicationDbContext _context;

        public StockController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: /api/stock (a loja vem do token)
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            if (!TenantId.HasValue) return Unauthorized();
            var tenantId = TenantId.Value;

            var list = await _context.Stocks
                .Where(s => s.TenantId == tenantId)
                .ToListAsync();

            return Ok(list);
        }

        // GET: /api/stock/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var item = await _context.Stocks.FindAsync(id);
            if (item == null || item.TenantId != TenantId)
                return NotFound();

            return Ok(item);
        }

        // POST: /api/stock
        [HttpPost]
        public async Task<IActionResult> Create(Stock model)
        {
            if (!IsBoss)
                return Forbid();

            model.TenantId = TenantId ?? 0;

            _context.Stocks.Add(model);
            await _context.SaveChangesAsync();

            var movement = new StockMovement
            {
                ProductId = model.Id,
                Type = "Entrada",
                Quantity = model.Quantity,
                Date = DateTime.Now,
                Observation = "Estoque inicial",
                TenantId = model.TenantId
            };

            _context.Movements.Add(movement);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id  = model.Id }, model);
        }

        // PUT: /api/stock/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Stock model)
        {
            if (!IsBoss)
                return Forbid();

            if (id != model.Id)
                return BadRequest();

            var existing = await _context.Stocks.FindAsync(id);
            if (existing == null || existing.TenantId != TenantId)
                return NotFound();

            existing.ProductName = model.ProductName;
            existing.Category = model.Category;
            existing.Quantity = model.Quantity;
            existing.UnitMeasure = model.UnitMeasure;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: /api/stock/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            if (!IsBoss)
                return Forbid();


            var existing = await _context.Stocks.FindAsync(id);
            if (existing == null || existing.TenantId != TenantId)
                return NotFound();

            _context.Stocks.Remove(existing);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
