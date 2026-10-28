using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using BeautySalonAPI.Entities;

namespace BeautySalonAPI.Data
{
    public class ApplicationDbContext : IdentityDbContext<Usuario>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<Tenant> Tenants { get; set; }
        public DbSet<Client> Clients { get; set; }
        public DbSet<Service> Services { get; set; }
        public DbSet<Usuario> Users { get; set; }
        public DbSet<Appointment> Appointments { get; set; }
        public DbSet<WorkSchedule> WorkSchedules { get; set; }
        public DbSet<Stock> Stocks { get; set; }
        public DbSet<StockMovement> Movements { get; set; }
        public DbSet<PasswordResetCode> PasswordResetCodes { get; set; }
    }
}
