using Api.Controllers;
using Api.Data;
using Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using StackExchange.Redis;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using NetTopologySuite.Geometries;
using NetTopologySuite.Features;

namespace Api.Tests;

public class MapTests
{
    private readonly Mock<IDatabase> _mockRedis;
    private readonly ApplicationDbContext _context;

    public MapTests()
    {
        _mockRedis = new Mock<IDatabase>();
        
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

    [Fact]
    public async Task GetStates_ShouldReturnFeatureCollection()
    {
        // Arrange
        var geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
        var state = new State 
        { 
            Id = 33, 
            Name = "Rio de Janeiro", 
            Acronym = "RJ", 
            RegionId = 1,
            Boundary = geometryFactory.CreatePolygon(new Coordinate[] {
                new Coordinate(-43, -22),
                new Coordinate(-42, -22),
                new Coordinate(-42, -23),
                new Coordinate(-43, -23),
                new Coordinate(-43, -22)
            })
        };
        _context.States.Add(state);
        await _context.SaveChangesAsync();

        var controller = new MapController(_context, CreateMockMuxer(_mockRedis.Object));

        // Act
        var result = await controller.GetStates();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var featureCollection = Assert.IsType<FeatureCollection>(okResult.Value);
        Assert.Single(featureCollection);
        Assert.Equal("Rio de Janeiro", featureCollection[0].Attributes["name"]);
    }

    [Fact]
    public async Task GetMunicipalities_ShouldReturnFeatureCollection()
    {
        // Arrange
        var geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
        
        var mesoregion = new Mesoregion { Id = 1, Name = "Meso", StateId = 33 };
        var microregion = new Microregion { Id = 1, Name = "Micro", MesoregionId = 1 };
        var immediate = new ImmediateRegion { Id = 1, Name = "Imed", IntermediateRegionId = 1 };
        _context.Mesoregions.Add(mesoregion);
        _context.Microregions.Add(microregion);
        _context.ImmediateRegions.Add(immediate);

        var mun = new Municipality 
        { 
            Id = 3304557, 
            Name = "Rio de Janeiro", 
            MicroregionId = 1,
            ImmediateRegionId = 1,
            Boundary = geometryFactory.CreatePoint(new Coordinate(-43.1729, -22.9068))
        };
        _context.Municipalities.Add(mun);
        await _context.SaveChangesAsync();

        var controller = new MapController(_context, CreateMockMuxer(_mockRedis.Object));

        // Act
        var result = await controller.GetMunicipalities(33);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var featureCollection = Assert.IsType<FeatureCollection>(okResult.Value);
        Assert.Single(featureCollection);
        Assert.Equal("Rio de Janeiro", featureCollection[0].Attributes["name"]);
    }
}
