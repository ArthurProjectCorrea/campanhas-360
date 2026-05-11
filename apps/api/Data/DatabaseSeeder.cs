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

            // 3. Seed Screens
            if (!await context.Screens.AnyAsync())
            {
                logger.LogInformation("Semeando telas (Screens)...");
                var screens = new List<Screen>
                {
                    new Screen { Id = 1, Key = "dashboard", Title = "Dashboard Executivo", Description = "Visão geral da campanha", Sidebar = "Dashboard", Icon = "layout-dashboard" },
                    new Screen { Id = 2, Key = "regional_planning", Title = "Planejamento Regional", Description = "Gestão de zonas eleitorais e roteiros", Sidebar = "Planejamento", Icon = "square-chart-gantt" },
                    new Screen { Id = 3, Key = "organization_profile", Title = "Perfil da Organização", Description = "Controle de dados da Organização", Sidebar = "Organização", Icon = "landmark" },
                    new Screen { Id = 4, Key = "user_registration", Title = "Cadastro de Usuários", Description = "Cadastro e gerenciamento de usuários", Sidebar = "Usuários", Icon = "users" },
                    new Screen { Id = 5, Key = "access_profile", Title = "Perfil de Acesso", Description = "Gerencie as permissões e configurações deste perfil.", Sidebar = "Perfis de Acesso", Icon = "fingerprint-pattern" }
                };
                context.Screens.AddRange(screens);
                await context.SaveChangesAsync();
            }

            // 4. Seed Permissions
            if (!await context.Permissions.AnyAsync())
            {
                logger.LogInformation("Semeando permissões (Permissions)...");
                var permissions = new List<Permission>
                {
                    new Permission { Id = 1, Key = "view", Name = "Visualizar" },
                    new Permission { Id = 2, Key = "update", Name = "Atualizar" },
                    new Permission { Id = 3, Key = "delete", Name = "Deletar" },
                    new Permission { Id = 4, Key = "create", Name = "Criar" }
                };
                context.Permissions.AddRange(permissions);
                await context.SaveChangesAsync();
            }

            // 5. Seed Access Profile
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

            // Garantir que o Administrador tenha as permissões corretas
            if (!await context.Accesses.AnyAsync(a => a.AccessProfileId == profile.Id))
            {
                logger.LogInformation("Concedendo permissões mapeadas ao perfil Administrador...");
                var allScreens = await context.Screens.ToListAsync();
                var allPermissions = await context.Permissions.ToListAsync();

                var mappings = new Dictionary<string, string[]>
                {
                    { "dashboard", new[] { "view" } },
                    { "regional_planning", new[] { "view", "update", "create", "delete" } },
                    { "organization_profile", new[] { "view", "update", "create", "delete" } },
                    { "user_registration", new[] { "view", "update", "create", "delete" } },
                    { "access_profile", new[] { "view", "update", "create", "delete" } }
                };

                foreach (var screen in allScreens)
                {
                    if (mappings.TryGetValue(screen.Key, out var validPermissions))
                    {
                        foreach (var pKey in validPermissions)
                        {
                            var permission = allPermissions.FirstOrDefault(p => p.Key == pKey);
                            if (permission != null)
                            {
                                context.Accesses.Add(new Access
                                {
                                    AccessProfileId = profile.Id,
                                    ScreenId = screen.Id,
                                    PermissionId = permission.Id
                                });
                            }
                        }
                    }
                }
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
