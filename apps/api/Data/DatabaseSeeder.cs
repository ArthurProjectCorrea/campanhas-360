using Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

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
                    { "organization_profile", new[] { "view", "update", "create" } },
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

            // 7. Seed Regions and States from IBGE
            if (!await context.Regions.AnyAsync())
            {
                logger.LogInformation("Semeando Regiões e Estados vindo do IBGE...");
                using var clientHttp = new HttpClient();
                try
                {
                    var response = await clientHttp.GetAsync("https://servicodados.ibge.gov.br/api/v1/localidades/estados");
                    if (response.IsSuccessStatusCode)
                    {
                        var json = await response.Content.ReadAsStringAsync();
                        using var doc = System.Text.Json.JsonDocument.Parse(json);
                        var root = doc.RootElement;

                        foreach (var stateElement in root.EnumerateArray())
                        {
                            var regiaoElement = stateElement.GetProperty("regiao");
                            int regionId = regiaoElement.GetProperty("id").GetInt32();

                            // Garantir que a região existe
                            var region = await context.Regions.FindAsync(regionId);
                            if (region == null)
                            {
                                region = new Region
                                {
                                    Id = regionId,
                                    Acronym = regiaoElement.GetProperty("sigla").GetString() ?? "",
                                    Name = regiaoElement.GetProperty("nome").GetString() ?? ""
                                };
                                context.Regions.Add(region);
                                await context.SaveChangesAsync();
                            }

                            // Criar o estado
                            int stateId = stateElement.GetProperty("id").GetInt32();
                            if (!await context.States.AnyAsync(s => s.Id == stateId))
                            {
                                context.States.Add(new State
                                {
                                    Id = stateId,
                                    Acronym = stateElement.GetProperty("sigla").GetString() ?? "",
                                    Name = stateElement.GetProperty("nome").GetString() ?? "",
                                    RegionId = regionId
                                });
                            }
                        }
                        await context.SaveChangesAsync();
                        logger.LogInformation("Estados e Regiões semeados com sucesso.");
                    }
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Erro ao buscar dados do IBGE para o Seed.");
                }
            }

            // 8. Seed Municipalities and Hierarchy from IBGE
            var municipalityCount = await context.Municipalities.CountAsync();
            logger.LogInformation("Total de municípios no banco: {Count}", municipalityCount);

            if (municipalityCount < 5500)
            {
                logger.LogInformation("Semeando Municípios e hierarquia vindo do IBGE (modo incremental por estado)...");
                using var clientHttp = new HttpClient();
                clientHttp.Timeout = TimeSpan.FromMinutes(2);

                var statesList = await context.States.Select(s => s.Id).ToListAsync();
                var mesoIds = await context.Mesoregions.Select(m => m.Id).ToHashSetAsync();
                var microIds = await context.Microregions.Select(m => m.Id).ToHashSetAsync();
                var interIds = await context.IntermediateRegions.Select(m => m.Id).ToHashSetAsync();
                var imedIds = await context.ImmediateRegions.Select(m => m.Id).ToHashSetAsync();
                var existingMunIds = await context.Municipalities.Select(m => m.Id).ToHashSetAsync();

                foreach (var stateId in statesList)
                {
                    try
                    {
                        logger.LogInformation("Buscando municípios para o estado ID: {StateId}", stateId);
                        var response = await clientHttp.GetAsync($"https://servicodados.ibge.gov.br/api/v1/localidades/estados/{stateId}/municipios");

                        if (!response.IsSuccessStatusCode) continue;

                        var jsonString = await response.Content.ReadAsStringAsync();
                        using var doc = JsonDocument.Parse(jsonString);

                        int count = 0;
                        int stateAddedCount = 0;
                        foreach (var munElement in doc.RootElement.EnumerateArray())
                        {
                            try
                            {
                                int munId = munElement.GetProperty("id").GetInt32();
                                if (existingMunIds.Contains(munId)) continue;

                                // 1. Meso e Micro
                                if (!munElement.TryGetProperty("microrregiao", out var microElement) ||
                                    microElement.ValueKind == JsonValueKind.Null) continue;

                                if (!microElement.TryGetProperty("mesorregiao", out var mesoElement) ||
                                    mesoElement.ValueKind == JsonValueKind.Null) continue;

                                int mesoId = mesoElement.GetProperty("id").GetInt32();
                                if (!mesoIds.Contains(mesoId))
                                {
                                    context.Mesoregions.Add(new Mesoregion { Id = mesoId, Name = mesoElement.GetProperty("nome").GetString() ?? "", StateId = stateId });
                                    mesoIds.Add(mesoId);
                                }

                                int microId = microElement.GetProperty("id").GetInt32();
                                if (!microIds.Contains(microId))
                                {
                                    context.Microregions.Add(new Microregion { Id = microId, Name = microElement.GetProperty("nome").GetString() ?? "", MesoregionId = mesoId });
                                    microIds.Add(microId);
                                }

                                // 2. Intermediária e Imediata
                                if (!munElement.TryGetProperty("regiao-imediata", out var imedElement) ||
                                    imedElement.ValueKind == JsonValueKind.Null) continue;

                                if (!imedElement.TryGetProperty("regiao-intermediaria", out var interElement) ||
                                    interElement.ValueKind == JsonValueKind.Null) continue;

                                int interId = interElement.GetProperty("id").GetInt32();
                                if (!interIds.Contains(interId))
                                {
                                    context.IntermediateRegions.Add(new IntermediateRegion { Id = interId, Name = interElement.GetProperty("nome").GetString() ?? "", StateId = stateId });
                                    interIds.Add(interId);
                                }

                                int imedId = imedElement.GetProperty("id").GetInt32();
                                if (!imedIds.Contains(imedId))
                                {
                                    context.ImmediateRegions.Add(new ImmediateRegion { Id = imedId, Name = imedElement.GetProperty("nome").GetString() ?? "", IntermediateRegionId = interId });
                                    imedIds.Add(imedId);
                                }

                                // 3. Município
                                context.Municipalities.Add(new Municipality
                                {
                                    Id = munId,
                                    Name = munElement.GetProperty("nome").GetString() ?? "",
                                    MicroregionId = microId,
                                    ImmediateRegionId = imedId
                                });

                                count++;
                                stateAddedCount++;
                                existingMunIds.Add(munId);

                                if (count % 100 == 0)
                                {
                                    await context.SaveChangesAsync();
                                }
                            }
                            catch (Exception ex)
                            {
                                logger.LogWarning(ex, "Erro ao processar município no estado {StateId}. Pulando...", stateId);
                                continue;
                            }
                        }
                        await context.SaveChangesAsync();
                        if (stateAddedCount > 0)
                            logger.LogInformation("Estado {StateId} concluído. Adicionados: {Added}", stateId, stateAddedCount);
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(ex, "Erro ao buscar municípios para o estado {StateId}", stateId);
                    }
                }
                logger.LogInformation("Sincronização de municípios finalizada.");
            }

            // 9. Seed Sample Candidate
            if (!await context.Candidates.AnyAsync())
            {
                logger.LogInformation("Semeando candidato de teste...");
                var sampleCandidate = new Candidate
                {
                    Name = "Fulano de Tal",
                    AvatarUrl = "",
                    BallotName = "Fulano do Povo",
                    CPF = "123.456.789-00",
                    SocialName = "",
                    BirthDate = new DateTime(1980, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    ClientId = client.Id,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                context.Candidates.Add(sampleCandidate);
                await context.SaveChangesAsync();
                logger.LogInformation("Candidato de teste semeado com sucesso.");
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
