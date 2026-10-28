using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BeautySalonAPI.Entities
{
    public class WorkSchedule
    {
        [Key]
        public int Id { get; set; }

        [ForeignKey("ProviderId")]

        public string? ProviderId { get; set; } 

        [Required]
        public DayOfWeek DayOfWeek { get; set; } 

        [Required]
        public TimeSpan StartTime { get; set; } 

        [Required]
        public TimeSpan EndTime { get; set; } 

        [ForeignKey("ProviderId")]
        public Usuario Provider { get; set; } 
    }
}
