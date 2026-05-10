using Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Api.Data;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var logger = services.GetRequiredService<ILogger<Program>>();

        try
        {
            logger.LogInformation("Iniciando o processo de Seed do banco de dados...");

            // 1. Garantir que as migrations foram aplicadas
            if (context.Database.ProviderName != "Microsoft.EntityFrameworkCore.InMemory")
            {
                await context.Database.MigrateAsync();
            }
            else
            {
                await context.Database.EnsureCreatedAsync();
            }

            // 2. Seed Client
            var client = await context.Clients.FirstOrDefaultAsync(c => c.Domain == "main");
            if (client == null)
            {
                logger.LogInformation("Criando cliente padrão 'main'...");
                client = new Client
                {
                    Id = Guid.NewGuid(),
                    Name = "Main Client",
                    Domain = "main",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                context.Clients.Add(client);
                await context.SaveChangesAsync();
            }

            // 3. Seed Access Profile
            var profile = await context.AccessProfiles.FirstOrDefaultAsync(p => p.Name == "Administrador" && p.ClientId == client.Id);
            if (profile == null)
            {
                logger.LogInformation("Criando perfil de acesso 'Administrador'...");
                profile = new AccessProfile
                {
                    Id = Guid.NewGuid(),
                    Name = "Administrador",
                    ClientId = client.Id,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                context.AccessProfiles.Add(profile);
                await context.SaveChangesAsync();
            }

            // 4. Seed Admin User
            var adminEmail = Environment.GetEnvironmentVariable("ADMIN_EMAIL") ?? "admin@exemplo.com";
            var adminPassword = Environment.GetEnvironmentVariable("ADMIN_PASSWORD") ?? "Senha@12345";

            var adminUser = await userManager.FindByEmailAsync(adminEmail);
            if (adminUser == null)
            {
                logger.LogInformation("Criando usuário administrador: {Email}", adminEmail);
                adminUser = new ApplicationUser
                {
                    Id = Guid.NewGuid(),
                    UserName = adminEmail,
                    Email = adminEmail,
                    Name = "user admin",
                    ClientId = client.Id,
                    AccessProfileId = profile.Id,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                var result = await userManager.CreateAsync(adminUser, adminPassword);
                if (!result.Succeeded)
                {
                    var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                    logger.LogError("Falha ao criar usuário admin: {Errors}", errors);
                }
                else
                {
                    logger.LogInformation("Usuário administrador criado com sucesso.");
                }
            }
            else
            {
                logger.LogInformation("Usuário administrador já existe.");
            }

            logger.LogInformation("Seed do banco de dados concluído.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Erro fatal durante o Seed do banco de dados.");
            throw;
        }
    }
}
