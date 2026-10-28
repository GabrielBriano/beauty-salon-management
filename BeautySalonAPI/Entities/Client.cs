namespace BeautySalonAPI.Entities
{
    public class Client
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Phone { get; set; }
        public string? Email { get; set; }
        public int TenantId { get; set; }
        public DateTime CreateAt { get; set; } = DateTime.UtcNow;
    }
}
