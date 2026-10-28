namespace BeautySalonAPI.Models
{
    public class RegisterModel
    {
        public string Name { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string Type { get; set; } = "Client";// Client, Professional, Boss
        public int TenantId { get; set; } = 1;
    }
}
