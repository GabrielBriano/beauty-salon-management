namespace BeautySalonAPI.Infrastructure.Tenancy
{
    public class TenantPublicConfig
    {
        public int Id { get; set; }
        public string Slug { get; set; } = "";
        public string Name { get; set; } = "";
        public string Timezone { get; set; } = "America/Sao_Paulo";
    }
}
