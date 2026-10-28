namespace BeautySalonAPI.DTOs
{
    public class AppointmentCreateDTO
    {
        public string ClientId { get; set; } = default!;
        public string ProfessionalId { get; set; } = default!;
        public int ServiceId { get; set; }
        public DateTime DateTimeInit { get; set; }
        public DateTime? DateTimeEnd { get; set; }
        public string? Status { get; set; }
        public string? Observations { get; set; }
    }
}
