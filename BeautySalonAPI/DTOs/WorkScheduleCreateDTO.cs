namespace BeautySalonAPI.DTOs
{
    public class WorkScheduleCreateDTO
    {
        public string ProviderId { get; set; }
        public int DayOfWeek { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
    }
}
