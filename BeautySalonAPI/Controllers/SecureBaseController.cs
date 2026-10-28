using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BeautySalonAPI.Controllers
{
    public class SecureBaseController : ControllerBase
    {
        protected string? UserId => User.FindFirstValue("UserId");
        protected string? UserType => User.FindFirstValue("Type");
        protected int? TenantId =>
            int.TryParse(User.FindFirstValue("TenantId"), out var id) ? id : null;

        protected bool IsBoss => string.Equals(UserType, "Boss", StringComparison.OrdinalIgnoreCase);
        protected bool IsProfessional => string.Equals(UserType, "Professional", StringComparison.OrdinalIgnoreCase);
        protected bool IsClient => string.Equals(UserType, "Client", StringComparison.OrdinalIgnoreCase);
    }
}
