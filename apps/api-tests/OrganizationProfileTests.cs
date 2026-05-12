using Api.Controllers;
using Api.Data;
using Api.DTOs;
using Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using StackExchange.Redis;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;
using Microsoft.AspNetCore.Hosting;

namespace Api.Tests;

public class OrganizationProfileTests
{
    private readonly Mock<IDatabase> _mockRedis;
    private readonly Mock<IWebHostEnvironment> _mockEnv;
    private readonly ApplicationDbContext _context;

    public OrganizationProfileTests()
    {
        _mockRedis = new Mock<IDatabase>();
        _mockEnv = new Mock<IWebHostEnvironment>();
        
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new ApplicationDbContext(options);
    }

    private IConnectionMultiplexer CreateMockMuxer(IDatabase db)
    {
        var mock = new Mock<IConnectionMultiplexer>();
        mock.Setup(m => m.GetDatabase(It.IsAny<int>(), It.IsAny<object>())).Returns(db);
        return mock.Object;
    }

    private void SetupControllerContext(BaseApiController controller, string token, Guid userId, Guid clientId)
    {
        var sessionData = new BaseApiController.SessionData
        {
            UserId = userId,
            ClientId = clientId,
            Permissions = new List<UserPermissionDto>
            {
                new UserPermissionDto("organization_profile", "view"),
                new UserPermissionDto("organization_profile", "create"),
                new UserPermissionDto("organization_profile", "update")
            }
        };

        _mockRedis.Setup(r => r.StringGetAsync(token, It.IsAny<CommandFlags>()))
            .ReturnsAsync(JsonSerializer.Serialize(sessionData, BaseApiController.JsonOptions));

        controller.ControllerContext = new ControllerContext();
        controller.ControllerContext.HttpContext = new DefaultHttpContext();
        controller.Request.Headers["Authorization"] = $"Bearer {token}";
    }

    [Fact]
    public async Task CreateCampaign_ShouldCreate_WhenDataIsValid()
    {
        // Arrange
        var clientId = Guid.NewGuid();
        var token = "test-token";
        
        var client = new Client { Id = clientId, Name = "Test Client", Domain = "test" };
        _context.Clients.Add(client);

        var candidate = new Candidate { Id = 1, Name = "Test Candidate", ClientId = clientId };
        _context.Candidates.Add(candidate);

        var party = new Party { Id = 1, Name = "Test Party", Acronym = "TP" };
        _context.Parties.Add(party);

        var position = new Position { Id = 1, Name = "Test Position", Type = "MUNICIPAL" };
        _context.Positions.Add(position);

        await _context.SaveChangesAsync();

        var controller = new OrganizationProfileController(_context, CreateMockMuxer(_mockRedis.Object), _mockEnv.Object);
        SetupControllerContext(controller, token, Guid.NewGuid(), clientId);

        var request = new CreateCampaignRequest(
            CandidateNumber: 12345,
            ElectionYear: 2024,
            PartyId: 1,
            PositionId: 1,
            StateId: 1, // Optional now
            MunicipalityId: 1, // Optional now
            LegalSpendingLimit: 100000
        );

        // Act
        var result = await controller.CreateCampaign(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var campaigns = await _context.Campaigns.ToListAsync();
        Assert.Single(campaigns);
        Assert.Equal(12345, campaigns[0].CandidateNumber);
        Assert.True(campaigns[0].IsActive);
    }

    [Fact]
    public async Task CreateCampaign_ShouldInactivatePrevious_WhenNewIsCreated()
    {
        // Arrange
        var clientId = Guid.NewGuid();
        var token = "test-token";
        
        var client = new Client { Id = clientId, Name = "Test Client", Domain = "test" };
        _context.Clients.Add(client);

        var candidate = new Candidate { Id = 1, Name = "Test Candidate", ClientId = clientId };
        _context.Candidates.Add(candidate);

        var oldCampaign = new Campaign 
        { 
            CandidateId = 1, 
            ClientId = clientId, 
            IsActive = true, 
            PartyId = 1, 
            PositionId = 1,
            ElectionYear = 2020
        };
        _context.Campaigns.Add(oldCampaign);
        await _context.SaveChangesAsync();

        var controller = new OrganizationProfileController(_context, CreateMockMuxer(_mockRedis.Object), _mockEnv.Object);
        SetupControllerContext(controller, token, Guid.NewGuid(), clientId);

        var request = new CreateCampaignRequest(12345, 2024, 1, 1, 1, 1, 100000);

        // Act
        await controller.CreateCampaign(request);

        // Assert
        var campaigns = await _context.Campaigns.OrderBy(c => c.ElectionYear).ToListAsync();
        Assert.Equal(2, campaigns.Count);
        Assert.False(campaigns[0].IsActive); // 2020
        Assert.True(campaigns[1].IsActive);  // 2024
    }
}
