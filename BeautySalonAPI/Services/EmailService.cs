using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;

namespace BeautySalonAPI.Services
{
    public class EmailService
    {
        private readonly EmailSettings _settings;

        public EmailService(IOptions<EmailSettings> options)
        {
            _settings = options.Value;
        }

        public async Task SendAsync(string to, string subject, string body)
        {
            if (string.IsNullOrWhiteSpace(_settings.User) || string.IsNullOrWhiteSpace(_settings.Password))
                throw new InvalidOperationException("E-mail não configurado (seção Email).");

            using var client = new SmtpClient(_settings.Host, _settings.Port)
            {
                Credentials = new NetworkCredential(_settings.User, _settings.Password),
                EnableSsl = true
            };

            var from = string.IsNullOrWhiteSpace(_settings.From) ? _settings.User : _settings.From;
            using var message = new MailMessage(from, to, subject, body) { IsBodyHtml = true };

            await client.SendMailAsync(message);
        }
    }
}
