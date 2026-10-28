using BeautySalonAPI.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace BeautySalonAPI.Infrastructure.Tenancy
{
    public interface ITenantResolver
    {
        Task<int> ResolveTenantIdAsync(HttpContext http, ApplicationDbContext db);
    }

    public class TenantResolver : ITenantResolver
    {
        public async Task<int> ResolveTenantIdAsync(HttpContext http, ApplicationDbContext db)
        {
            // 1) slug na rota: api/{tenantSlug}/...
            if (http.Request.RouteValues.TryGetValue("tenantSlug", out var slugObj))
            {
                var slug = slugObj?.ToString();
                if (!string.IsNullOrWhiteSpace(slug))
                {
                    var tenant = await db.Tenants
                        .AsNoTracking()
                        .FirstOrDefaultAsync(t => t.Slug == slug && t.Active);
                    if (tenant != null) return tenant.Id;
                }
            }

            // 2) header (se vier)
            if (http.Request.Headers.TryGetValue("X-Tenant-Id", out var h) && int.TryParse(h, out var tidHeader))
                return tidHeader;

            // aceita variações comuns
            if (http.Request.Headers.TryGetValue("X-TenantId", out var h2) && int.TryParse(h2, out var tid2))
                return tid2;
            if (http.Request.Headers.TryGetValue("X-TenantID", out var h3) && int.TryParse(h3, out var tid3))
                return tid3;

            // 3) querystring legado (?tenantId=)
            if (http.Request.Query.TryGetValue("tenantId", out var q) && int.TryParse(q, out var tidQuery))
                return tidQuery;

            throw new BadHttpRequestException("Tenant não informado.");
        }
    }
}
