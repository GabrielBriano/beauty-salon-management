using BeautySalonAPI.Data;
using BeautySalonAPI.Entities;
using BeautySalonAPI.Services;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using Microsoft.AspNetCore.Identity;


namespace BeautySalonAPI.Controllers
{
    [ApiController]
    [Route("api/email")]
    public class EmailController : ControllerBase
    {
        private readonly EmailService _emailService;
        private readonly ApplicationDbContext _context;

        public EmailController(EmailService emailService, ApplicationDbContext context)
        {
            _emailService = emailService;
            _context = context;
        }

        // POST: /api/email/send-reset-code
        [HttpPost("send-reset-code")]
        public async Task<IActionResult> SendResetCode([FromBody] ResetCodeRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
                return NotFound("User not found.");

            var code = new Random().Next(100000, 999999).ToString();

            var resetCode = new PasswordResetCode
            {
                Email = request.Email,
                Code = code,
                Expiration = DateTime.UtcNow.AddMinutes(5)
            };

            _context.PasswordResetCodes.Add(resetCode);
            await _context.SaveChangesAsync();

            await _emailService.SendAsync(request.Email, "Código de Recuperação", $"Seu código de verificação é: {code}");

            return Ok("Código enviado com sucesso.");
        }

        // POST: /api/email/verify-reset-code
        [HttpPost("verify-reset-code")]
        public async Task<IActionResult> VerifyResetCode([FromBody] VerifyCodeRequest request)
        {
            var codeEntry = await _context.PasswordResetCodes
                .Where(c => c.Email == request.Email && c.Code == request.Code)
                .OrderByDescending(c => c.Expiration)
                .FirstOrDefaultAsync();

            if (codeEntry == null)
                return BadRequest("Invalid code.");

            // Expire after 5 minutes
            if (DateTime.Now - codeEntry.Expiration > TimeSpan.FromMinutes(5))
                return BadRequest("Expired code.");

            return Ok("Valid code.");
        }

        // POST: /api/email/reset-password
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            var codeEntry = await _context.PasswordResetCodes
                .Where(c => c.Email == request.Email && c.Code == request.Code)
                .OrderByDescending(c => c.Expiration)
                .FirstOrDefaultAsync();

            if (codeEntry == null || codeEntry.Expiration < DateTime.Now)
                return BadRequest("Invalid or expired code.");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
                return NotFound("User not found.");

            var hashes = new PasswordHasher<Usuario>();
            user.PasswordHash = hashes.HashPassword(user, request.NewPassword);

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return Ok("Sucess reset password.");
        }

        public class ResetCodeRequest
        {
            public string Email { get; set; }
        }

        public class VerifyCodeRequest
        {
            public string Email { get; set; }
            public string Code { get; set; }
        }

        public class ResetPasswordRequest 
        {
            public string Email { get; set; }
            public string Code { get; set; }
            public string NewPassword { get; set; }
        }
    }
}
