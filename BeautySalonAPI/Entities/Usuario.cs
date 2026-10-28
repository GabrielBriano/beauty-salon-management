using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace BeautySalonAPI.Entities
{
    [Table("aspnetusers")]
    public class Usuario : IdentityUser
    {
        public string Name { get; set; }
        public string Type { get; set; } // client, professional, boss
        public int TenantId { get; set; }
        public bool Active { get; set; } = true;
        public DateTime CreationDate { get; set; } = DateTime.Now;
    }
}
