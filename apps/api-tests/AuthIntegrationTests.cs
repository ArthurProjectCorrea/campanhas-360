using Api.Data;
using Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Api.Tests;

public class AuthUnitTests
{
    private ApplicationDbContext GetDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task Database_ShouldCreateAndRetrieveRecords()
    {
        // Arrange
        using var context = GetDbContext();
        var clientId = Guid.NewGuid();
        var client = new Client { Id = clientId, Name = "Test Client", Domain = "test" };

        // Act
        context.Clients.Add(client);
        await context.SaveChangesAsync();

        // Assert
        var retrievedClient = await context.Clients.FindAsync(clientId);
        Assert.NotNull(retrievedClient);
        Assert.Equal("test", retrievedClient.Domain);
    }

    [Fact]
    public async Task AccessProfile_ShouldBeLinkedToClient()
    {
        // Arrange
        using var context = GetDbContext();
        var clientId = Guid.NewGuid();
        var client = new Client { Id = clientId, Name = "Test Client", Domain = "test" };
        var profile = new AccessProfile { Id = Guid.NewGuid(), Name = "Admin", ClientId = clientId };

        // Act
        context.Clients.Add(client);
        context.AccessProfiles.Add(profile);
        await context.SaveChangesAsync();

        // Assert
        var retrievedProfile = await context.AccessProfiles.Include(p => p.Client).FirstOrDefaultAsync(p => p.Id == profile.Id);
        Assert.NotNull(retrievedProfile);
        Assert.Equal(clientId, retrievedProfile.ClientId);
        Assert.NotNull(retrievedProfile.Client);
    }
}
