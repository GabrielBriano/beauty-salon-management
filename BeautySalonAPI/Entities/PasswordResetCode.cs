namespace BeautySalonAPI.Entities
{
    public class PasswordResetCode
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public DateTime Expiration { get; set; }
        public bool Used { get; set; } = false;
    }
}
