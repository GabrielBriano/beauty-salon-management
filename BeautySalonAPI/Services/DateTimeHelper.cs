using System.Globalization;

namespace BeautySalonAPI.Services
{
    public static class DateTimeHelper
    {
        // Combine "YYYY-MM-DD" + "HH:mm" in local DateTime 
        public static DateTime? CombineLocalDateAndTime(string? date, string? time)
        {
            if (string.IsNullOrWhiteSpace(date) || string.IsNullOrWhiteSpace(time))
                return null;

            // Try parse "yyyy-MM-dd" and "HH:mm"
            if (DateTime.TryParseExact($"{date} {time}",
                "yyyy-MM-dd HH:mm",
                CultureInfo.InvariantCulture,
                DateTimeStyles.None,
                out var dt))
            {
                return dt;
            }

            return null;
        }
    }
}
