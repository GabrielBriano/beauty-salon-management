namespace BeautySalonAPI.Entities
{
    public class StockMovement
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string Type { get; set; } // Entrada, Saida
        public int Quantity { get; set; }
        public DateTime Date { get; set; } = DateTime.Now;
        public string? Observation { get; set; }
        public int TenantId { get; set; }

    }
}
