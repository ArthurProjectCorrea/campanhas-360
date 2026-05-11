using Api.Data;
using Api.Models;
using Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using StackExchange.Redis;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Connection Strings from ENV
var dbConnectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING")
    ?? builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Database=dummy;Username=postgres;Password=password";
var redisConnectionString = Environment.GetEnvironmentVariable("REDIS_CONNECTION_STRING")
    ?? "localhost:6379";

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });
builder.Services.AddCors(options =>
{
    options.AddPolicy("WebClient", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Campanhas 360 API",
        Version = "v1",
        Description = "API para gestão de campanhas eleitorais 360.",
        Contact = new OpenApiContact
        {
            Name = "Suporte Técnico",
            Email = "suporte@campanhas360.com"
        }
    });

    // Configuração para usar Token no Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Insira o token retornado no login. Exemplo: '12345-abcde'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    // Incluir comentários XML
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    c.IncludeXmlComments(xmlPath);
});

// Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(dbConnectionString));

// Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole<Guid>>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireLowercase = false;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.MaxFailedAccessAttempts = 5;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Redis
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
    ConnectionMultiplexer.Connect(redisConnectionString));

// Email Service
builder.Services.AddScoped<IEmailService, SmtpEmailService>();

// Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("auth-limit", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.PermitLimit = 5;
        opt.QueueLimit = 0;
    });
});

var app = builder.Build();

// Seed and Migrations
using (var scope = app.Services.CreateScope())
{
    await DatabaseSeeder.SeedAsync(scope.ServiceProvider);
}

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Campanhas 360 API v1");
    c.RoutePrefix = string.Empty; // Swagger na raiz
});

app.UseHttpsRedirection();
app.UseCors("WebClient");
app.UseRateLimiter();
app.UseAuthorization();

app.MapControllers();

app.Run();

public partial class Program { }
