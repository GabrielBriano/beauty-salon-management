namespace BeautySalonAPI.Entities
{
    public class Tenant
    {
        public int Id { get; set; }
        public string Slug { get; set; } = string.Empty;
        public string Name { get; set; }
        public string? CNPJ { get; set; }
        public string Phone { get; set; }
        public string Address { get; set; }
        public bool Active { get; set; } = true;
        public string? Timezone { get; set; } = "America/Sao_Paulo";
        public DateTime RegistrationDate { get; set; } = DateTime.Now;
    }
}
