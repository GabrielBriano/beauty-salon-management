using System.Text;
using BeautySalonAPI.Data;
using BeautySalonAPI.Entities;
using BeautySalonAPI.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);
var MyCorsPolicy = "_myCorsPolicy";

var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32)
    throw new InvalidOperationException("Jwt:Key ausente ou curta (mínimo 32 caracteres). Configure com User Secrets ou variável de ambiente Jwt__Key.");

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? new[] { "http://localhost:5173" };

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("DefaultConnection"))
    ));

builder.Services.AddIdentity<Usuario, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer("Bearer", options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("Email"));
builder.Services.AddScoped<EmailService>();

builder.Services.AddAuthorization();

builder.Services.AddControllers();

builder.Services.AddScoped<BeautySalonAPI.Infrastructure.Tenancy.ITenantResolver, BeautySalonAPI.Infrastructure.Tenancy.TenantResolver>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "BeautySalonAPI", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme.\r\n\r\nExemplo: \"Bearer {token}\"",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = Microsoft.OpenApi.Models.ParameterLocation.Header
            },
            new List<string>()
        }
    });
});


builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyCorsPolicy,
        builder =>
        {
            builder
            .WithOrigins(allowedOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader();
        });
});

var app = builder.Build();
app.UseCors(MyCorsPolicy);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();

app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/api") && 
        context.Response.StatusCode == 401)
    {
        context.Response.Headers["WWW-Authenticate"] = "Bearer";
    }

    await next();
});

app.UseAuthorization();

app.MapControllers();
// Seed opcional de um usuário Boss (somente em Development): defina Seed:BossEmail e Seed:BossPassword nos User Secrets.
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var cfg = scope.ServiceProvider.GetRequiredService<IConfiguration>();
    var bossEmail = cfg["Seed:BossEmail"];
    var bossPassword = cfg["Seed:BossPassword"];

    if (!string.IsNullOrWhiteSpace(bossEmail) && !string.IsNullOrWhiteSpace(bossPassword))
    {
        var users = scope.ServiceProvider.GetRequiredService<UserManager<Usuario>>();
        if (await users.FindByEmailAsync(bossEmail) is null)
        {
            var boss = new Usuario
            {
                UserName = bossEmail,
                Email = bossEmail,
                Name = "Administrador",
                Type = "Boss",
                TenantId = cfg.GetValue<int?>("Seed:TenantId") ?? 1
            };
            var created = await users.CreateAsync(boss, bossPassword);
            if (!created.Succeeded)
                app.Logger.LogWarning("Seed do Boss falhou: {Errors}", string.Join("; ", created.Errors.Select(e => e.Description)));
        }
    }
}

app.Run();
