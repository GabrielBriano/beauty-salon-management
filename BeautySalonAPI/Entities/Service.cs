namespace BeautySalonAPI.Entities
{
    public class Service
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }
        public int DurationMin { get; set; }
        public decimal Price { get; set; }
        public int TenantId { get; set; }
    }
}
