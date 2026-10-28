using Microsoft.EntityFrameworkCore;
using BeautySalonAPI.Entities;
using BeautySalonAPI.Models;
using BeautySalonAPI.DTOs;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BeautySalonAPI.Services;
using BeautySalonAPI.Data;

namespace BeautySalonAPI.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<Usuario> _userManager;
        private readonly SignInManager<Usuario> _signInManager;
        private readonly IConfiguration _configuration;
        private readonly EmailService _emailService;
        private readonly ApplicationDbContext _context;

        public AuthController(UserManager<Usuario> userManager, SignInManager<Usuario> signInManager, IConfiguration configuration, EmailService emailService, ApplicationDbContext context)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
            _emailService = emailService;
            _context = context;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterModel model)
        {
            var tenantExists = await _context.Tenants.AnyAsync(t => t.Id == model.TenantId && t.Active);
            if (!tenantExists)
                return BadRequest("Loja inválida.");

            var user = new Usuario
            {
                UserName = model.Email,
                Email = model.Email,
                Name = model.Name,
                Type = "Client", // Boss e Professional são criados pelo administrador, nunca pelo cadastro público
                TenantId = model.TenantId
            };

            var result = await _userManager.CreateAsync(user, model.Password);

            if (!result.Succeeded)
                return BadRequest(result.Errors);

            return Ok("Usuário registrado com sucesso.");
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginModel model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);

            if (user == null)
                return Unauthorized("Usuário não encontrado.");

            var result = await _signInManager.CheckPasswordSignInAsync(user, model.Password,false);

            if (!result.Succeeded)
                return Unauthorized("Senha inválida.");

            var token = GenerateJwtToken(user);

            return Ok(new
            {
                token,
                user = new
                {
                    name = user.Name,
                    email = user.Email,
                    type = user.Type,
                    tenantId = user.TenantId
                }
            });
        }

        [HttpPost("send-reset-code")]
        public async Task <IActionResult> SendResetCode([FromBody] ForgotPasswordDTO model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
                return NotFound("User not found.");

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);

            await _emailService.SendAsync(user.Email, "Código para redefinir senha", $"Seu código: {token}");
            Console.WriteLine($"Código de redefinição: {token}");

            return Ok(new { message = "Sended code to email." });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDTO model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
                return NotFound("User not found.");

            var result = await _userManager.ResetPasswordAsync(user, model.Token, model.NewPassword);
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            return Ok(new { message = "Password change successful" });
        }

        private string GenerateJwtToken(Usuario user)
        {
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim("UserId", user.Id),
                new Claim("TenantId", user.TenantId.ToString()),
                new Claim("Type", user.Type),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(8),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

    }
}
