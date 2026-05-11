using Api.Controllers;
using Api.Data;
using Api.DTOs;
using Api.Models;
using Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using StackExchange.Redis;
using System.Text.Json;
using Xunit;

namespace Api.Tests;

public class AuthRefreshTests
{
    private readonly Mock<UserManager<ApplicationUser>> _mockUserManager;
    private readonly Mock<IDatabase> _mockRedis;
    private readonly Mock<IEmailService> _mockEmail;
    private readonly ApplicationDbContext _context;

    public AuthRefreshTests()
    {
        // Mock UserManager
        var store = new Mock<IUserStore<ApplicationUser>>();
        _mockUserManager = new Mock<UserManager<ApplicationUser>>(store.Object, null, null, null, null, null, null, null, null);

        // Mock Redis
        _mockRedis = new Mock<IDatabase>();

        // Mock Email
        _mockEmail = new Mock<IEmailService>();

        // DbContext InMemory
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new ApplicationDbContext(options);
    }

    [Fact]
    public async Task Refresh_ShouldReturnOk_AndNewToken_WhenSessionIsValid()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var clientId = Guid.NewGuid();
        var profileId = Guid.NewGuid();
        var oldToken = "old-token";

        // Simular sessão no Redis
        var sessionData = new { UserId = userId };
        _mockRedis.Setup(r => r.StringGetAsync(oldToken, It.IsAny<CommandFlags>())).ReturnsAsync(JsonSerializer.Serialize(sessionData));

        // Simular usuário ativo no UserManager
        var user = new ApplicationUser 
        { 
            Id = userId, 
            Name = "Test User", 
            IsActive = true, 
            ClientId = clientId, 
            AccessProfileId = profileId 
        };
        _mockUserManager.Setup(m => m.FindByIdAsync(userId.ToString())).ReturnsAsync(user);

        // Adicionar Client e Profile no DB
        var client = new Client { Id = clientId, Name = "Test Client", Domain = "test", IsActive = true };
        _context.Clients.Add(client);

        var profile = new AccessProfile { Id = profileId, Name = "Admin", ClientId = clientId, IsActive = true };
        _context.AccessProfiles.Add(profile);
        await _context.SaveChangesAsync();

        // Setup Mock para StringSetAsync
        _mockRedis.Setup(r => r.StringSetAsync(It.IsAny<RedisKey>(), It.IsAny<RedisValue>(), It.IsAny<TimeSpan?>(), It.IsAny<When>(), It.IsAny<CommandFlags>())).ReturnsAsync(true);

        var controller = new AuthController(_mockUserManager.Object, _context, CreateMockMuxer(_mockRedis.Object), _mockEmail.Object);
        
        // Setup HttpContext para Headers
        controller.ControllerContext = new ControllerContext();
        controller.ControllerContext.HttpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext();
        controller.Request.Headers["Authorization"] = $"Bearer {oldToken}";

        // Act
        var result = await controller.Refresh();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<SignInResponse>(okResult.Value);
        
        Assert.NotEqual(oldToken, response.Token);
        Assert.Equal("Test User", response.UserName);
        Assert.Equal("test", response.ClientDomain);
        
        // Verificar se deletou o token antigo
        _mockRedis.Verify(r => r.KeyDeleteAsync(oldToken, It.IsAny<CommandFlags>()), Times.Once());
    }

    [Fact]
    public async Task Refresh_ShouldReturn403_WhenUserIsInactive()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var oldToken = "old-token";

        var sessionData = new { UserId = userId };
        _mockRedis.Setup(r => r.StringGetAsync(oldToken, It.IsAny<CommandFlags>())).ReturnsAsync(JsonSerializer.Serialize(sessionData));

        // Usuário Inativo
        var user = new ApplicationUser { Id = userId, IsActive = false };
        _mockUserManager.Setup(m => m.FindByIdAsync(userId.ToString())).ReturnsAsync(user);

        var controller = new AuthController(_mockUserManager.Object, _context, CreateMockMuxer(_mockRedis.Object), _mockEmail.Object);
        controller.ControllerContext = new ControllerContext();
        controller.ControllerContext.HttpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext();
        controller.Request.Headers["Authorization"] = $"Bearer {oldToken}";

        // Act
        var result = await controller.Refresh();

        // Assert
        var statusCodeResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(403, statusCodeResult.StatusCode);
        
        // Deve ter deletado a sessão antiga por segurança
        _mockRedis.Verify(r => r.KeyDeleteAsync(oldToken, It.IsAny<CommandFlags>()), Times.Once());
    }

    [Fact]
    public async Task Refresh_ShouldReturn401_WhenTokenIsInvalid()
    {
        // Arrange
        var oldToken = "invalid-token";
        _mockRedis.Setup(r => r.StringGetAsync(oldToken, It.IsAny<CommandFlags>())).ReturnsAsync(RedisValue.Null);

        var controller = new AuthController(_mockUserManager.Object, _context, CreateMockMuxer(_mockRedis.Object), _mockEmail.Object);
        controller.ControllerContext = new ControllerContext();
        controller.ControllerContext.HttpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext();
        controller.Request.Headers["Authorization"] = $"Bearer {oldToken}";

        // Act
        var result = await controller.Refresh();

        // Assert
        Assert.IsType<UnauthorizedObjectResult>(result);
    }

    private IConnectionMultiplexer CreateMockMuxer(IDatabase db)
    {
        var mock = new Mock<IConnectionMultiplexer>();
        mock.Setup(m => m.GetDatabase(It.IsAny<int>(), It.IsAny<object>())).Returns(db);
        return mock.Object;
    }
}
