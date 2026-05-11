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
using Xunit;

namespace Api.Tests;

public class PasswordTests
{
    private readonly Mock<UserManager<ApplicationUser>> _mockUserManager;
    private readonly Mock<IDatabase> _mockRedis;
    private readonly Mock<IEmailService> _mockEmail;
    private readonly ApplicationDbContext _context;

    public PasswordTests()
    {
        // Mock UserManager
        var store = new Mock<IUserStore<ApplicationUser>>();
        _mockUserManager = new Mock<UserManager<ApplicationUser>>(store.Object, null, null, null, null, null, null, null, null);

        // Mock Redis
        var mockMuxer = new Mock<IConnectionMultiplexer>();
        _mockRedis = new Mock<IDatabase>();
        mockMuxer.Setup(m => m.GetDatabase(It.IsAny<int>(), It.IsAny<object>())).Returns(_mockRedis.Object);

        // Mock Email
        _mockEmail = new Mock<IEmailService>();

        // DbContext
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new ApplicationDbContext(options);
    }

    [Fact]
    public async Task ForgotPassword_ShouldReturnOk_AndSendEmail_WhenUserExists()
    {
        // Arrange
        var email = "test@exemplo.com";
        var user = new ApplicationUser { Id = Guid.NewGuid(), Email = email, Name = "Test User", IsActive = true };
        _mockUserManager.Setup(m => m.FindByEmailAsync(email)).ReturnsAsync(user);
        
        var controller = new AuthController(_mockUserManager.Object, _context, CreateMockMuxer(_mockRedis.Object), _mockEmail.Object);

        // Act
        var result = await controller.ForgotPassword(new ForgotPasswordRequest(email));

        // Assert
        Assert.IsType<OkObjectResult>(result);
        _mockEmail.Verify(m => m.SendOtpEmailAsync(email, user.Name, It.IsAny<string>()), Times.AtMostOnce());
    }

    [Fact]
    public async Task VerifyOtp_ShouldReturnBadRequest_WhenOtpIsInvalid()
    {
        // Arrange
        var email = "test@exemplo.com";
        var request = new VerifyOtpRequest(email, "000000");
        _mockRedis.Setup(r => r.StringGetAsync($"otp_code:{email}", It.IsAny<CommandFlags>())).ReturnsAsync("123456");

        var controller = new AuthController(_mockUserManager.Object, _context, CreateMockMuxer(_mockRedis.Object), _mockEmail.Object);

        // Act
        var result = await controller.VerifyOtp(request);

        // Assert
        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Contains("Código inválido", badRequest.Value.ToString());
    }

    private IConnectionMultiplexer CreateMockMuxer(IDatabase db)
    {
        var mock = new Mock<IConnectionMultiplexer>();
        mock.Setup(m => m.GetDatabase(It.IsAny<int>(), It.IsAny<object>())).Returns(db);
        return mock.Object;
    }
}
