namespace BeautySalonAPI.Entities
{
    public class Appointment
    {
        public int Id { get; set; }
        public string ClientId { get; set; }
        public string ProfessionalId { get; set; }
        public int ServiceId { get; set; }
        public Service Service { get; set; }
        public DateTime DateTimeInit { get; set; }
        public DateTime DateTimeEnd { get; set; }
        public string Status { get; set; } // Agendado, Confirmado, Atendido, Cancelado
        public string? Observations { get; set; }
        public int TenantId { get; set; }
    }
}
