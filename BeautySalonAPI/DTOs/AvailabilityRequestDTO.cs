namespace BeautySalonAPI.DTOs
{
    public class AvailabilityRequestDTO
    {
        public string ProviderId { get; set; }
        public int ServiceId { get; set; }
        public DateTime Date { get; set; }
    }
}
