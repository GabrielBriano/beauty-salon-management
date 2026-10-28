namespace BeautySalonAPI.DTOs
{
    public class AppointmentPublicDTO
    {
        public int ServiceId { get; set; }
        public string ProfessionalId { get; set; } = string.Empty;
        public int? UnitId { get; set; }

        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Notes { get; set; }

        // "YYYY-MM-DD"
        public string? Date { get; set; }
        // "HH:mm"
        public string? Time { get; set; }
        public DateTime? StartDateTime { get; set; }

        public int TenantId { get; set; }
    }
}
