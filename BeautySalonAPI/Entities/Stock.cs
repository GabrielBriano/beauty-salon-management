namespace BeautySalonAPI.Entities
{
    public class Stock
    {
        public int Id { get; set; }
        public string ProductName { get; set; }
        public int Quantity { get; set; }
        public string UnitMeasure { get; set; } // ml, unidade, etc.
        public string? Category { get; set; }
        public int TenantId { get; set; }
    }
}
