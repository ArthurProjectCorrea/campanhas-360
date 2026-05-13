using Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Features;
using NetTopologySuite.IO;
using StackExchange.Redis;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MapController : BaseApiController
{
    public MapController(ApplicationDbContext context, IConnectionMultiplexer redis) : base(context, redis)
    {
    }

    [HttpGet("states")]
    public async Task<IActionResult> GetStates()
    {
        var states = await Context.States
            .Where(s => s.Boundary != null)
            .Select(s => new
            {
                s.Id,
                s.Name,
                s.Acronym,
                Boundary = s.Boundary
            })
            .ToListAsync();

        var featureCollection = new FeatureCollection();
        foreach (var state in states)
        {
            var attributes = new AttributesTable
            {
                { "id", state.Id },
                { "name", state.Name },
                { "acronym", state.Acronym }
            };
            featureCollection.Add(new Feature(state.Boundary, attributes));
        }

        return Ok(featureCollection);
    }

    [HttpGet("municipalities")]
    public async Task<IActionResult> GetMunicipalities([FromQuery] int? stateId)
    {
        var query = Context.Municipalities
            .Where(m => m.Boundary != null);

        if (stateId.HasValue)
        {
            query = query.Where(m => m.Microregion.Mesoregion.StateId == stateId.Value);
        }

        var municipalities = await query
            .Select(m => new
            {
                m.Id,
                m.Name,
                Boundary = m.Boundary
            })
            .ToListAsync();

        var featureCollection = new FeatureCollection();
        foreach (var mun in municipalities)
        {
            var attributes = new AttributesTable
            {
                { "id", mun.Id },
                { "name", mun.Name }
            };
            featureCollection.Add(new Feature(mun.Boundary, attributes));
        }

        return Ok(featureCollection);
    }
}
